import { createClient } from '@supabase/supabase-js';
import { BookingRequest, BookingStatus, Guest, Property, Review, SiteSettings } from '../../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_GUESTS,
  INITIAL_PROPERTIES,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
} from './seed-data';
import { findConflictingConfirmedBookings, validateBookingDates } from '../bookings/validation';
import { normalizeWhatsAppNumber } from '../whatsapp';
import { supabaseApiFetch } from './database';

const supabaseUrl =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL ||
  (import.meta as unknown as { env: Record<string, string> }).env?.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as unknown as { env: Record<string, string> }).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabaseBrowserClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const ADMIN_TOKEN_KEY = 'rafiki_admin_session_token';
const DB_STORAGE_KEY = 'rafiki_living_local_db';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    if (supabaseBrowserClient) void supabaseBrowserClient.auth.signOut();
  }
}

interface LocalStore {
  properties: Property[];
  guests: Guest[];
  bookings: BookingRequest[];
  reviews: Review[];
  settings: SiteSettings;
  seq: number;
}

function getLocalStore(): LocalStore {
  if (typeof window === 'undefined') {
    return {
      properties: INITIAL_PROPERTIES,
      guests: INITIAL_GUESTS,
      bookings: INITIAL_BOOKINGS,
      reviews: INITIAL_REVIEWS,
      settings: INITIAL_SETTINGS,
      seq: 14,
    };
  }

  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.properties)) {
        // Ensure image URLs are updated if previously stored as empty
        parsed.properties = parsed.properties.map((p: Property) => {
          const seedProp = INITIAL_PROPERTIES.find((sp) => sp.id === p.id);
          if (seedProp && (!p.images || p.images.length === 0 || !p.images[0]?.url)) {
            return { ...p, images: seedProp.images };
          }
          return p;
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local store:', e);
  }

  const initialStore: LocalStore = {
    properties: structuredClone(INITIAL_PROPERTIES),
    guests: structuredClone(INITIAL_GUESTS),
    bookings: structuredClone(INITIAL_BOOKINGS),
    reviews: structuredClone(INITIAL_REVIEWS),
    settings: {
      ...structuredClone(INITIAL_SETTINGS),
      whatsapp_number: normalizeWhatsAppNumber(INITIAL_SETTINGS.whatsapp_number),
    },
    seq: 14,
  };
  saveLocalStore(initialStore);
  return initialStore;
}

function saveLocalStore(store: LocalStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save local store:', e);
  }
}

function recalculateRatings(store: LocalStore): void {
  for (const prop of store.properties) {
    const pub = store.reviews.filter((r) => r.property_id === prop.id && r.published);
    prop.review_count = pub.length;
    if (pub.length > 0) {
      const sum = pub.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      prop.rating = Math.round((sum / pub.length) * 10) / 10;
    } else {
      prop.rating = undefined;
    }
  }
}

/**
 * Universal API Fetch with Client-Side Fallback Store.
 * Supports both cloud Supabase or fully persistent local storage.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAdminAuth = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Check token if required
  if (includeAdminAuth) {
    const token = getAdminToken();
    if (!token && endpoint.startsWith('/api/admin') && !endpoint.includes('/login')) {
      throw new Error('Authentication required. Please sign in at /admin/login.');
    }
  }

  if (supabaseBrowserClient) {
    return supabaseApiFetch<T>(endpoint, method, body, includeAdminAuth);
  }

  const store = getLocalStore();
  recalculateRatings(store);

  // 1. /api/public/bootstrap
  if (endpoint === '/api/public/bootstrap') {
    const publishedProps = store.properties.filter((p) => p.published);
    const publishedIds = new Set(publishedProps.map((p) => p.id));
    const publishedReviews = store.reviews.filter(
      (r) => r.published && publishedIds.has(r.property_id)
    );
    const confirmedBlocks = store.bookings
      .filter((b) => b.status === 'confirmed' && publishedIds.has(b.property_id))
      .map((b) => ({
        property_id: b.property_id,
        check_in: b.check_in,
        check_out: b.check_out,
      }));

    return {
      properties: publishedProps,
      reviews: publishedReviews,
      confirmedDateBlocks: confirmedBlocks,
      settings: {
        ...store.settings,
        supabase_configured: Boolean(supabaseBrowserClient),
      },
    } as T;
  }

  if (endpoint === '/api/public/bookings/lookup-by-email' && method === 'POST') {
    throw new Error('Email booking recovery requires a connected Supabase database and email service.');
  }

  // 2. /api/public/stays/:slug
  if (endpoint.startsWith('/api/public/stays/')) {
    const slug = endpoint.replace('/api/public/stays/', '').split('?')[0];
    const property = store.properties.find((p) => p.slug === slug && p.published);
    if (!property) throw new Error('Stay not found or currently unavailable.');

    const reviews = store.reviews.filter((r) => r.property_id === property.id && r.published);
    const confirmedBlocks = store.bookings
      .filter((b) => b.property_id === property.id && b.status === 'confirmed')
      .map((b) => ({
        property_id: b.property_id,
        check_in: b.check_in,
        check_out: b.check_out,
      }));

    return {
      property,
      reviews,
      confirmedDateBlocks: confirmedBlocks,
    } as T;
  }

  // 3. /api/public/bookings (Create Booking Request)
  if (endpoint === '/api/public/bookings' && method === 'POST') {
    const {
      property_id,
      check_in,
      check_out,
      guests_count,
      full_name,
      email,
      phone,
      special_requests,
    } = body;

    if (!property_id || !full_name?.trim() || !email?.trim() || !phone?.trim()) {
      throw new Error('Please fill in your full name, email address, and WhatsApp/phone number.');
    }

    const prop = store.properties.find((p) => p.id === property_id && p.published);
    if (!prop) throw new Error('Selected property is not available.');

    const dateVal = validateBookingDates(check_in, check_out);
    if (!dateVal.valid) throw new Error(dateVal.error);

    const parsedGuests = Number(guests_count) || 1;
    if (parsedGuests > prop.max_guests) {
      throw new Error(`${prop.name} accommodates a maximum of ${prop.max_guests} guests.`);
    }

    const conflicts = findConflictingConfirmedBookings(store.bookings, prop.id, check_in, check_out);
    if (conflicts.length > 0) {
      const c = conflicts[0];
      throw new Error(
        `${prop.name} is already confirmed and unavailable from ${c.check_in} to ${c.check_out}. Please choose alternative dates.`
      );
    }

    let guest = store.guests.find((g) => g.email.toLowerCase() === email.trim().toLowerCase());
    if (!guest) {
      guest = {
        id: `guest-${Date.now()}`,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        created_at: new Date().toISOString(),
      };
      store.guests.unshift(guest);
    } else {
      guest.full_name = full_name.trim();
      guest.phone = phone.trim();
    }

    const seq = store.seq++;
    const reference_number = `RFL-2026-${String(seq).padStart(4, '0')}`;
    const newBooking: BookingRequest = {
      id: `bk-2026-${String(seq).padStart(4, '0')}`,
      reference_number,
      property_id: prop.id,
      property_name: prop.name,
      property_slug: prop.slug,
      property_location: `${prop.location}, ${prop.city}`,
      guest_id: guest.id,
      guest_name: guest.full_name,
      guest_email: guest.email,
      guest_phone: guest.phone,
      check_in,
      check_out,
      guests_count: parsedGuests,
      total_nights: dateVal.nights,
      estimated_total: dateVal.nights * prop.price_per_night,
      special_requests: (special_requests || '').trim(),
      status: 'pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.bookings.unshift(newBooking);
    saveLocalStore(store);

    const { admin_notes: _h, ...publicBooking } = newBooking;
    return { booking: publicBooking } as T;
  }

  // 4. /api/public/bookings/:idOrRef
  if (endpoint.startsWith('/api/public/bookings/')) {
    const idOrRef = endpoint.replace('/api/public/bookings/', '').split('?')[0].toUpperCase();
    const booking = store.bookings.find(
      (b) => b.id.toUpperCase() === idOrRef || b.reference_number.toUpperCase() === idOrRef
    );

    if (!booking) {
      throw new Error('Booking reference not found. Please check your reference code (e.g. RFL-2026-0012).');
    }

    const prop = store.properties.find((p) => p.id === booking.property_id);
    const { admin_notes: _h, ...publicBooking } = booking;
    return {
      booking: publicBooking,
      property: prop
        ? {
            id: prop.id,
            name: prop.name,
            slug: prop.slug,
            location: prop.location,
            city: prop.city,
            check_in_time: prop.check_in_time,
            check_out_time: prop.check_out_time,
            cover_image: prop.images.find((i) => i.is_cover)?.url || prop.images[0]?.url || '',
          }
        : null,
    } as T;
  }

  // 5. Admin Login
  if (endpoint === '/api/admin/login' && method === 'POST') {
    throw new Error('Admin sign-in requires Supabase configuration.');
  }

  // 6. Admin Overview
  if (endpoint === '/api/admin/overview') {
    return {
      properties: store.properties,
      bookings: store.bookings,
      guests: store.guests,
      reviews: store.reviews,
      settings: store.settings,
    } as T;
  }

  // 7. Admin Booking Status Update
  if (endpoint.startsWith('/api/admin/bookings/') && method === 'PATCH') {
    const id = endpoint.replace('/api/admin/bookings/', '').split('?')[0];
    const booking = store.bookings.find((b) => b.id === id);
    if (!booking) throw new Error('Booking not found.');

    const nextStatus = (body.status || booking.status) as BookingStatus;
    const nextCheckIn = body.check_in || booking.check_in;
    const nextCheckOut = body.check_out || booking.check_out;

    if (nextStatus === 'confirmed') {
      const conflicts = findConflictingConfirmedBookings(
        store.bookings,
        booking.property_id,
        nextCheckIn,
        nextCheckOut,
        booking.id
      );
      if (conflicts.length > 0) {
        const c = conflicts[0];
        throw new Error(
          `Double-booking prevented: ${booking.property_name} already has a confirmed booking (${c.reference_number}) from ${c.check_in} to ${c.check_out}.`
        );
      }
    }

    booking.status = nextStatus;
    if (body.admin_notes !== undefined) booking.admin_notes = body.admin_notes;
    booking.updated_at = new Date().toISOString();
    saveLocalStore(store);
    return { booking } as T;
  }

  // 8. Admin Property CRUD
  if (endpoint === '/api/admin/properties' && method === 'POST') {
    const propId = `prop-${Date.now()}`;
    const newProp: Property = {
      ...body,
      id: propId,
      slug: (body.slug || body.name.toLowerCase().replace(/\s+/g, '-')).toLowerCase(),
      images: body.images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.properties.push(newProp);
    saveLocalStore(store);
    return { property: newProp } as T;
  }

  if (endpoint.startsWith('/api/admin/properties/') && method === 'PUT') {
    const id = endpoint.replace('/api/admin/properties/', '').split('?')[0];
    const idx = store.properties.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Property not found.');
    store.properties[idx] = { ...store.properties[idx], ...body, updated_at: new Date().toISOString() };
    saveLocalStore(store);
    return { property: store.properties[idx] } as T;
  }

  if (endpoint.startsWith('/api/admin/properties/') && method === 'DELETE') {
    const id = endpoint.replace('/api/admin/properties/', '').split('?')[0];
    store.properties = store.properties.filter((p) => p.id !== id);
    saveLocalStore(store);
    return { success: true } as T;
  }

  // 9. Admin Review CRUD
  if (endpoint === '/api/admin/reviews' && method === 'POST') {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      property_id: body.property_id,
      guest_name: body.guest_name,
      guest_origin: body.guest_origin || 'Verified Guest',
      rating: Number(body.rating) || 5,
      comment: body.comment,
      stay_date: body.stay_date || 'October 2026',
      published: body.published !== undefined ? body.published : true,
      created_at: new Date().toISOString(),
    };
    store.reviews.unshift(newReview);
    recalculateRatings(store);
    saveLocalStore(store);
    return { review: newReview } as T;
  }

  if (endpoint.startsWith('/api/admin/reviews/') && method === 'PUT') {
    const id = endpoint.replace('/api/admin/reviews/', '').split('?')[0];
    const review = store.reviews.find((r) => r.id === id);
    if (!review) throw new Error('Review not found.');
    Object.assign(review, body);
    recalculateRatings(store);
    saveLocalStore(store);
    return { review } as T;
  }

  if (endpoint.startsWith('/api/admin/reviews/') && method === 'DELETE') {
    const id = endpoint.replace('/api/admin/reviews/', '').split('?')[0];
    store.reviews = store.reviews.filter((r) => r.id !== id);
    recalculateRatings(store);
    saveLocalStore(store);
    return { success: true } as T;
  }

  // 10. Admin Settings
  if (endpoint === '/api/admin/settings' && method === 'PUT') {
    if (body.whatsapp_number) body.whatsapp_number = normalizeWhatsAppNumber(body.whatsapp_number);
    store.settings = { ...store.settings, ...body };
    saveLocalStore(store);
    return { settings: store.settings } as T;
  }

  throw new Error(`Unhandled route: ${endpoint}`);
}
