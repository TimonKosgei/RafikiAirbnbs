import { BookingRequest, BookingStatus, Guest, Property, PropertyImage, Review, SiteSettings } from '../../types';
import { findConflictingConfirmedBookings, validateBookingDates } from '../bookings/validation';
import { normalizeWhatsAppNumber } from '../whatsapp';
import { INITIAL_SETTINGS } from './seed-data';
import { supabaseBrowserClient } from './client';

type DatabaseRow = Record<string, any>;

function client() {
  if (!supabaseBrowserClient) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseBrowserClient;
}

function ensureSuccess<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  const data = ensureSuccess(result);
  if (data === null) throw new Error('Supabase returned no data.');
  return data;
}

async function postEmailApi(endpoint: string, body: DatabaseRow): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(result.error || 'Email service request failed.');
  }
}

function mapProperty(row: DatabaseRow): Property {
  const images = [...((row.property_images || []) as PropertyImage[])].sort(
    (a, b) => a.display_order - b.display_order
  );
  return {
    ...row,
    neighborhood_overview: row.neighborhood_overview || '',
    amenities: row.amenities || [],
    images,
  } as Property;
}

function mapReview(row: DatabaseRow, properties: Property[] = []): Review {
  return {
    ...row,
    property_name: properties.find((property) => property.id === row.property_id)?.name,
    guest_origin: row.guest_origin || 'Verified Guest',
    stay_date: row.stay_date || '',
  } as Review;
}

function applyReviewStats(properties: Property[], reviews: Review[]): Property[] {
  return properties.map((property) => {
    const published = reviews.filter(
      (review) => review.property_id === property.id && review.published
    );
    return {
      ...property,
      review_count: published.length,
      rating: published.length
        ? Math.round(
            (published.reduce((total, review) => total + Number(review.rating), 0) /
              published.length) *
              10
          ) / 10
        : undefined,
    };
  });
}

function mapBooking(row: DatabaseRow): BookingRequest {
  const property = row.properties || {};
  const guest = row.guests || {};
  return {
    ...row,
    property_name: property.name || row.property_name || '',
    property_slug: property.slug || row.property_slug || '',
    property_location: property.name
      ? `${property.location}, ${property.city}`
      : row.property_location || '',
    guest_name: guest.full_name || row.guest_name || '',
    guest_email: guest.email || row.guest_email || '',
    guest_phone: guest.phone || row.guest_phone || '',
    special_requests: row.special_requests || '',
    admin_notes: row.admin_notes || '',
  } as BookingRequest;
}

async function getSettings(): Promise<SiteSettings> {
  const rows = unwrap(await client().from('settings').select('key,value'));
  const settings = { ...INITIAL_SETTINGS } as SiteSettings;
  for (const row of rows as DatabaseRow[]) {
    if (row.key in settings) {
      const key = row.key as Exclude<keyof SiteSettings, 'supabase_configured'>;
      settings[key] = String(row.value);
    }
  }
  settings.whatsapp_number = normalizeWhatsAppNumber(settings.whatsapp_number);
  settings.supabase_configured = true;
  return settings;
}

async function listProperties(publishedOnly: boolean): Promise<Property[]> {
  let query = client()
    .from('properties')
    .select('*, property_images(*)')
    .order('created_at', { ascending: false });
  if (publishedOnly) query = query.eq('published', true);
  return (unwrap(await query) as DatabaseRow[]).map(mapProperty);
}

async function listReviews(publishedOnly: boolean, properties: Property[]): Promise<Review[]> {
  let query = client().from('reviews').select('*').order('created_at', { ascending: false });
  if (publishedOnly) query = query.eq('published', true);
  return (unwrap(await query) as DatabaseRow[]).map((row) => mapReview(row, properties));
}

async function saveImages(propertyId: string, images: PropertyImage[]): Promise<void> {
  const supabase = client();
  const rows = await Promise.all(
    images.map(async (image, index) => {
      let url = image.url;
      if (url.startsWith('data:')) {
        const blob = await (await fetch(url)).blob();
        const extension = blob.type === 'image/png' ? 'png' : 'jpg';
        const path = `${propertyId}/${crypto.randomUUID()}.${extension}`;
        const result = await supabase.storage.from('property-images').upload(path, blob, {
          contentType: blob.type,
          upsert: false,
        });
        if (result.error) throw new Error(result.error.message);
        url = supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
      }
      return {
        property_id: propertyId,
        url,
        alt: image.alt || '',
        is_cover: Boolean(image.is_cover),
        display_order: image.display_order ?? index,
      };
    })
  );
  ensureSuccess(await supabase.from('property_images').delete().eq('property_id', propertyId));
  if (rows.length > 0) ensureSuccess(await supabase.from('property_images').insert(rows));
}

function propertyPayload(body: DatabaseRow): DatabaseRow {
  const {
    id: _id,
    images: _images,
    rating: _rating,
    review_count: _reviewCount,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...fields
  } = body;
  return fields;
}

async function saveProperty(body: DatabaseRow, existingId?: string) {
  const supabase = client();
  const payload = {
    ...propertyPayload(body),
    updated_at: new Date().toISOString(),
  };
  const result = existingId
    ? await supabase.from('properties').update(payload).eq('id', existingId).select().single()
    : await supabase.from('properties').insert(payload).select().single();
  const row = unwrap(result) as DatabaseRow;
  await saveImages(row.id, (body.images || []) as PropertyImage[]);
  return { property: mapProperty({ ...row, property_images: body.images || [] }) };
}

async function adminOverview() {
  const supabase = client();
  const [properties, bookingRows, guests, reviews, settings] = await Promise.all([
    listProperties(false),
    supabase
      .from('booking_requests')
      .select('*, properties(name,slug,location,city), guests(full_name,email,phone)')
      .order('created_at', { ascending: false }),
    supabase.from('guests').select('*').order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    getSettings(),
  ]);
  const mappedReviews = (unwrap(reviews) as DatabaseRow[]).map((row) =>
    mapReview(row, properties)
  );
  return {
    properties: applyReviewStats(properties, mappedReviews),
    bookings: (unwrap(bookingRows) as DatabaseRow[]).map(mapBooking),
    guests: unwrap(guests) as Guest[],
    reviews: mappedReviews,
    settings,
  };
}

export async function supabaseApiFetch<T>(
  endpoint: string,
  method: string,
  body: DatabaseRow,
  includeAdminAuth: boolean
): Promise<T> {
  const supabase = client();

  if (includeAdminAuth && endpoint.startsWith('/api/admin') && endpoint !== '/api/admin/login') {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Authentication required. Please sign in at /admin/login.');
  }

  let result: unknown;

  if (endpoint === '/api/admin/login' && method === 'POST') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(body.email || '').trim(),
      password: String(body.password || ''),
    });
    if (error) throw new Error(error.message);
    if (!data.user || !data.session) throw new Error('Supabase did not return an authenticated session.');

    const profile = await supabase
      .from('profiles')
      .select('email,full_name,role')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profile.error || !profile.data || !['admin', 'manager'].includes(profile.data.role)) {
      await supabase.auth.signOut();
      throw new Error('This account is not authorized to access the admin dashboard.');
    }
    result = {
      token: data.session.access_token,
      admin: { email: profile.data.email, name: profile.data.full_name },
    };
  } else if (endpoint === '/api/public/bootstrap') {
    const [properties, settings] = await Promise.all([listProperties(true), getSettings()]);
    const [reviews, bookings] = await Promise.all([
      listReviews(true, properties),
      supabase.rpc('public_confirmed_date_blocks', { p_property_id: null }),
    ]);
    const propertiesWithRatings = applyReviewStats(properties, reviews);
    result = {
      properties: propertiesWithRatings,
      reviews,
      confirmedDateBlocks: unwrap(bookings),
      settings,
    };
  } else if (endpoint.startsWith('/api/public/stays/')) {
    const slug = decodeURIComponent(endpoint.replace('/api/public/stays/', '').split('?')[0]);
    const propertyResult = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (propertyResult.error) throw new Error(propertyResult.error.message);
    const propertyRow = propertyResult.data as DatabaseRow | null;
    if (!propertyRow) throw new Error('Stay not found or currently unavailable.');
    const property = mapProperty(propertyRow);
    const [reviews, bookings] = await Promise.all([
      supabase.from('reviews').select('*').eq('property_id', property.id).eq('published', true),
      supabase.rpc('public_confirmed_date_blocks', { p_property_id: property.id }),
    ]);
    const mappedReviews = (unwrap(reviews) as DatabaseRow[]).map((row) =>
      mapReview(row, [property])
    );
    result = {
      property: applyReviewStats([property], mappedReviews)[0],
      reviews: mappedReviews,
      confirmedDateBlocks: unwrap(bookings),
    };
  } else if (endpoint === '/api/public/bookings/lookup-by-email' && method === 'POST') {
    await postEmailApi('/api/booking-email-lookup', { email: body.email });
    result = {
      message: 'If bookings are associated with that email, we have sent the details to it.',
    };
  } else if (endpoint === '/api/public/bookings' && method === 'POST') {
    const dateCheck = validateBookingDates(body.check_in, body.check_out);
    if (!dateCheck.valid) throw new Error(dateCheck.error);
    const bookingResult = unwrap(
      await supabase.rpc('create_booking_request', {
        p_data: {
          ...body,
          full_name: String(body.full_name || '').trim(),
          email: String(body.email || '').trim().toLowerCase(),
          phone: String(body.phone || '').trim(),
          special_requests: String(body.special_requests || '').trim(),
        },
      })
    ) as { booking: { reference_number: string } };
    let emailNotificationFailed = false;
    try {
      await postEmailApi('/api/booking-notifications', {
        reference_number: bookingResult.booking.reference_number,
      });
    } catch (error) {
      console.error('Booking email notification failed:', error);
      emailNotificationFailed = true;
    }
    result = { ...bookingResult, emailNotificationFailed };
  } else if (endpoint.startsWith('/api/public/bookings/')) {
    const reference = decodeURIComponent(endpoint.replace('/api/public/bookings/', '').split('?')[0]);
    result = unwrap(await supabase.rpc('lookup_booking_request', { p_reference: reference }));
  } else if (endpoint === '/api/admin/overview') {
    result = await adminOverview();
  } else if (endpoint.startsWith('/api/admin/bookings/') && method === 'PATCH') {
    const id = endpoint.replace('/api/admin/bookings/', '').split('?')[0];
    const lookup = await supabase
      .from('booking_requests')
      .select('*, properties(name,slug,location,city), guests(full_name,email,phone)')
      .eq('id', id)
      .single();
    const current = unwrap(lookup) as DatabaseRow;
    const nextStatus = (body.status || current.status) as BookingStatus;
    const nextCheckIn = body.check_in || current.check_in;
    const nextCheckOut = body.check_out || current.check_out;
    if (nextStatus === 'confirmed') {
      const confirmed = unwrap(
        await supabase
          .from('booking_requests')
          .select('id,property_id,check_in,check_out,status,reference_number')
          .eq('property_id', current.property_id)
          .eq('status', 'confirmed')
      ) as BookingRequest[];
      const conflicts = findConflictingConfirmedBookings(
        confirmed,
        current.property_id,
        nextCheckIn,
        nextCheckOut,
        id
      );
      if (conflicts.length) {
        const conflict = conflicts[0];
        throw new Error(
          `Double-booking prevented: ${current.properties.name} already has a confirmed booking (${conflict.reference_number}) from ${conflict.check_in} to ${conflict.check_out}.`
        );
      }
    }
    const updated = unwrap(
      await supabase
        .from('booking_requests')
        .update({
          status: nextStatus,
          ...(body.check_in ? { check_in: body.check_in } : {}),
          ...(body.check_out ? { check_out: body.check_out } : {}),
          ...(body.admin_notes !== undefined ? { admin_notes: body.admin_notes } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, properties(name,slug,location,city), guests(full_name,email,phone)')
        .single()
    ) as DatabaseRow;
    result = { booking: mapBooking(updated) };
  } else if (endpoint === '/api/admin/properties' && method === 'POST') {
    result = await saveProperty(body);
  } else if (endpoint.startsWith('/api/admin/properties/') && method === 'PUT') {
    const id = endpoint.replace('/api/admin/properties/', '').split('?')[0];
    result = await saveProperty(body, id);
  } else if (endpoint.startsWith('/api/admin/properties/') && method === 'DELETE') {
    const id = endpoint.replace('/api/admin/properties/', '').split('?')[0];
    ensureSuccess(await supabase.from('properties').delete().eq('id', id));
    result = { success: true };
  } else if (endpoint === '/api/admin/reviews' && method === 'POST') {
    const row = unwrap(
      await supabase
        .from('reviews')
        .insert({
          property_id: body.property_id,
          guest_name: body.guest_name,
          guest_origin: body.guest_origin || 'Verified Guest',
          rating: Number(body.rating) || 5,
          comment: body.comment,
          stay_date: body.stay_date || '',
          published: body.published !== false,
        })
        .select()
        .single()
    ) as DatabaseRow;
    result = { review: mapReview(row) };
  } else if (endpoint.startsWith('/api/admin/reviews/') && method === 'PUT') {
    const id = endpoint.replace('/api/admin/reviews/', '').split('?')[0];
    const row = unwrap(
      await supabase.from('reviews').update(body).eq('id', id).select().single()
    ) as DatabaseRow;
    result = { review: mapReview(row) };
  } else if (endpoint.startsWith('/api/admin/reviews/') && method === 'DELETE') {
    const id = endpoint.replace('/api/admin/reviews/', '').split('?')[0];
    ensureSuccess(await supabase.from('reviews').delete().eq('id', id));
    result = { success: true };
  } else if (endpoint === '/api/admin/settings' && method === 'PUT') {
    const settings: SiteSettings = {
      ...INITIAL_SETTINGS,
      whatsapp_number: normalizeWhatsAppNumber(body.whatsapp_number || INITIAL_SETTINGS.whatsapp_number),
      phone_number: String(body.phone_number || INITIAL_SETTINGS.phone_number),
      support_email: String(body.support_email || INITIAL_SETTINGS.support_email),
      office_address: String(body.office_address || INITIAL_SETTINGS.office_address),
      company_tagline: String(body.company_tagline || INITIAL_SETTINGS.company_tagline),
    };
    const rows = Object.entries(settings)
      .filter(([key]) => key !== 'supabase_configured')
      .map(([key, value]) => ({ key, value: String(value ?? '') }));
    ensureSuccess(await supabase.from('settings').upsert(rows, { onConflict: 'key' }));
    result = { settings };
  } else {
    throw new Error(`Unhandled route: ${endpoint}`);
  }

  return result as T;
}
