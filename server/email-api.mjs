import 'dotenv/config';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const port = Number(process.env.EMAIL_API_PORT || 3001);
const host = process.env.EMAIL_API_HOST || '127.0.0.1';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const smtpUser = process.env.SMTP_USER;
const smtpAppPassword = process.env.SMTP_APP_PASSWORD;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const adminEmail = process.env.ADMIN_BOOKING_EMAIL || smtpUser;
const requestLimits = new Map();
const sentBookingNotices = new Map();

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const mailer =
  smtpUser && smtpAppPassword
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpPort === 465,
        requireTLS: smtpPort === 587,
        auth: { user: smtpUser, pass: smtpAppPassword.replace(/\s/g, '') },
      })
    : null;

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function safeHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function requireServices() {
  if (!supabase || !mailer || !adminEmail) {
    throw new Error('Email service is not configured on the server.');
  }
}

async function readJson(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 10_000) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function allowRequest(request, bucket, maxRequests, windowMs) {
  const now = Date.now();
  const forwardedFor = request.headers['x-forwarded-for'];
  const clientAddress =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0].trim() ||
    request.socket?.remoteAddress ||
    'unknown';
  const key = `${bucket}:${clientAddress}`;
  const timestamps = (requestLimits.get(key) || []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  requestLimits.set(key, timestamps);
  return true;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-KE', {
    dateStyle: 'long',
    timeZone: 'Africa/Nairobi',
  });
}

function bookingEmail(booking, property, guest, isAdminCopy = false) {
  const name = escapeHtml(guest.full_name);
  const propertyName = escapeHtml(property.name);
  const ref = escapeHtml(booking.reference_number);
  const checkIn = escapeHtml(formatDate(booking.check_in));
  const checkOut = escapeHtml(formatDate(booking.check_out));
  const status = escapeHtml(booking.status);
  const rows = [
    ['Booking reference', ref],
    ['Property', propertyName],
    ['Check-in', checkIn],
    ['Check-out', checkOut],
    ['Guests', escapeHtml(booking.guests_count)],
    ['Estimated total', `KES ${escapeHtml(Number(booking.estimated_total).toLocaleString('en-KE'))}`],
    ['Status', status],
  ];
  const details = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 12px">${label}</th><td style="padding:8px 12px">${value}</td></tr>`
    )
    .join('');
  const requests = booking.special_requests
    ? `<p><strong>Special requests:</strong> ${escapeHtml(booking.special_requests)}</p>`
    : '';
  const guestDetails = isAdminCopy
    ? `<p><strong>Guest:</strong> ${name}<br><strong>Email:</strong> ${escapeHtml(guest.email)}<br><strong>Phone:</strong> ${escapeHtml(guest.phone)}</p>`
    : '';
  const subject = safeHeader(
    isAdminCopy
      ? `New booking request ${booking.reference_number} - ${property.name}`
      : `Your Rafiki Airbnbs booking request ${booking.reference_number}`
  );
  const text = [
    isAdminCopy ? `New booking request for ${property.name}` : `Hello ${guest.full_name},`,
    `Booking reference: ${booking.reference_number}`,
    `Property: ${property.name}`,
    `Check-in: ${formatDate(booking.check_in)}`,
    `Check-out: ${formatDate(booking.check_out)}`,
    `Guests: ${booking.guests_count}`,
    `Estimated total: KES ${Number(booking.estimated_total).toLocaleString('en-KE')}`,
    `Status: ${booking.status}`,
    booking.special_requests ? `Special requests: ${booking.special_requests}` : '',
    isAdminCopy ? `Guest: ${guest.full_name} <${guest.email}> · ${guest.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#1A1D1B;max-width:640px;margin:auto"><h2>${isAdminCopy ? 'New booking request' : `Booking request received, ${name}`}</h2><p>${isAdminCopy ? 'A guest submitted a booking request.' : 'Thank you for your booking request. Our team will contact you to confirm your stay.'}</p>${guestDetails}<table style="border-collapse:collapse;width:100%;background:#F2EFE9">${details}</table>${requests}<p>Rafiki Airbnbs · Feel at home in Kenya</p></div>`,
  };
}

function recoveryEmail(bookings) {
  const name = escapeHtml(bookings[0].guest.full_name);
  const sections = bookings
    .map(({ booking, guest }) => bookingEmail(booking, booking.properties, guest).html)
    .join('<hr style="margin:24px 0;border:0;border-top:1px solid #ddd">');
  const text = [
    `Hello ${bookings[0].guest.full_name},`,
    'Here are the booking details associated with this email address:',
    ...bookings.flatMap(({ booking }) => [
      '',
      `Booking reference: ${booking.reference_number}`,
      `Property: ${booking.properties.name}`,
      `Check-in: ${formatDate(booking.check_in)}`,
      `Check-out: ${formatDate(booking.check_out)}`,
      `Status: ${booking.status}`,
    ]),
  ].join('\n');
  return {
    subject: 'Your Rafiki Airbnbs booking details',
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#1A1D1B;max-width:640px;margin:auto"><h2>Booking details</h2><p>Hello ${name}, here are your booking details.</p>${sections}</div>`,
  };
}

async function findBooking(reference) {
  const { data, error } = await supabase
    .from('booking_requests')
    .select('*, guests!inner(id,full_name,email,phone), properties!inner(id,name,location,city)')
    .eq('reference_number', reference.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getAdminRecipients() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['admin', 'manager']);
  if (error) throw new Error(`Could not load admin booking recipients: ${error.message}`);

  const recipients = new Set(
    (data || [])
      .map((profile) => String(profile.email || '').trim().toLowerCase())
      .filter(Boolean)
  );
  if (adminEmail) recipients.add(adminEmail.trim().toLowerCase());
  if (!recipients.size) throw new Error('No admin booking email recipients are configured.');
  return [...recipients];
}

async function sendBookingEmails(record) {
  const booking = record;
  const guest = booking.guests;
  const property = booking.properties;
  const adminRecipients = await getAdminRecipients();
  const results = await Promise.allSettled([
    mailer.sendMail({
      from: { name: 'Rafiki Airbnbs', address: smtpUser },
      to: guest.email,
      ...bookingEmail(booking, property, guest),
    }),
    mailer.sendMail({
      from: { name: 'Rafiki Airbnbs Bookings', address: smtpUser },
      to: smtpUser,
      bcc: adminRecipients.filter(
        (recipient) => recipient !== smtpUser.trim().toLowerCase()
      ),
      ...bookingEmail(booking, property, guest, true),
    }),
  ]);
  const rejected = results.filter((result) => result.status === 'rejected');
  if (rejected.length) throw new Error('One or more booking emails could not be sent.');
}

async function sendBookingNotification(request, response) {
  if (!allowRequest(request, 'notification', 30, 60 * 60 * 1000)) {
    return json(response, 429, { error: 'Please wait before requesting another booking email.' });
  }
  const body = await readJson(request);
  const reference = String(body.reference_number || '').trim();
  if (!reference || reference.length > 64) {
    return json(response, 400, { error: 'A valid booking reference is required.' });
  }

  requireServices();
  const booking = await findBooking(reference);
  if (!booking) return json(response, 404, { error: 'Booking was not found.' });

  const sentAt = sentBookingNotices.get(booking.id);
  if (sentAt && Date.now() - sentAt < 15 * 60 * 1000) {
    return json(response, 200, { sent: true });
  }

  await sendBookingEmails(booking);
  for (const [bookingId, timestamp] of sentBookingNotices) {
    if (Date.now() - timestamp >= 15 * 60 * 1000) sentBookingNotices.delete(bookingId);
  }
  sentBookingNotices.set(booking.id, Date.now());
  return json(response, 200, { sent: true });
}

async function sendEmailLookup(request, response) {
  if (!allowRequest(request, 'lookup', 20, 15 * 60 * 1000)) {
    return json(response, 429, { error: 'Too many requests. Please try again later.' });
  }
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return json(response, 400, { error: 'Enter a valid email address.' });
  }
  if (!allowRequest(request, `lookup-email:${email}`, 3, 15 * 60 * 1000)) {
    return json(response, 429, { error: 'Too many requests. Please try again later.' });
  }

  requireServices();
  const { data: guests, error } = await supabase
    .from('guests')
    .select('id,full_name,email,phone')
    .eq('email', email);
  if (error) throw new Error(error.message);

  const guestIds = (guests || []).map((guest) => guest.id);
  let bookings = [];
  if (guestIds.length) {
    const result = await supabase
      .from('booking_requests')
      .select('*, properties!inner(id,name,location,city)')
      .in('guest_id', guestIds)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) throw new Error(result.error.message);
    bookings = (result.data || []).map((booking) => ({
      booking,
      guest: guests.find((guest) => guest.id === booking.guest_id),
    }));
  }
  if (bookings.length) {
    await mailer.sendMail({
      from: { name: 'Rafiki Airbnbs', address: smtpUser },
      to: email,
      ...recoveryEmail(bookings),
    });
  }

  return json(response, 200, {
    message: 'If bookings are associated with that email, we have sent the details to it.',
  });
}

export async function handleEmailApiRequest(request, response, route) {
  try {
    if (request.method === 'GET' && route === '/api/email-health') {
      return json(response, 200, {
        configured: Boolean(supabase && mailer && adminEmail),
      });
    }
    if (request.method === 'POST' && route === '/api/booking-notifications') {
      return await sendBookingNotification(request, response);
    }
    if (request.method === 'POST' && route === '/api/booking-email-lookup') {
      return await sendEmailLookup(request, response);
    }
    return json(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error('Booking email service error:', error instanceof Error ? error.message : error);
    return json(response, 500, {
      error: 'The email service could not complete this request. Please contact Rafiki Airbnbs.',
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createServer((request, response) =>
    handleEmailApiRequest(request, response, new URL(request.url, 'http://localhost').pathname)
  );

  server.listen(port, host, () => {
    console.log(`Booking email API listening on http://${host}:${port}`);
  });
}
