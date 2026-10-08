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

async function getCompanyTagline() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'company_tagline')
    .maybeSingle();
  if (error) throw new Error(`Could not load company tagline: ${error.message}`);
  return data?.value || 'Where Every Stay Feels Like Home.';
}

function emailShell(content, tagline) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f2ed;font-family:Arial,Helvetica,sans-serif;color:#1a1d1b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ed;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#244537;padding:24px 30px;color:#ffffff"><div style="font-family:Georgia,serif;font-size:25px;font-weight:bold;letter-spacing:.2px">Rafiki Airbnbs</div><div style="margin-top:6px;color:#e3d3ad;font-size:13px">${escapeHtml(tagline)}</div></td></tr><tr><td style="padding:28px 30px">${content}</td></tr><tr><td style="border-top:1px solid #e8e6df;padding:18px 30px;color:#696d68;font-size:12px;line-height:1.6">Rafiki Airbnbs · Nairobi, Kenya<br><span style="color:#85877f">${escapeHtml(tagline)}</span></td></tr></table></td></tr></table></body></html>`;
}

function bookingEmail(booking, property, guest, tagline, isAdminCopy = false) {
  const name = escapeHtml(guest.full_name);
  const propertyName = escapeHtml(property.name);
  const location = escapeHtml([property.location, property.city].filter(Boolean).join(', '));
  const ref = escapeHtml(booking.reference_number);
  const checkIn = escapeHtml(formatDate(booking.check_in));
  const checkOut = escapeHtml(formatDate(booking.check_out));
  const status = escapeHtml(booking.status);
  const amount = `KES ${Number(booking.estimated_total).toLocaleString('en-KE')}`;
  const greeting = isAdminCopy
    ? `<p style="margin:0 0 20px;color:#555b56;font-size:14px;line-height:1.6">A new booking request has been submitted. Guest and stay details are below.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#f7f6f2;border-radius:10px"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.8"><strong>${name}</strong><br><a href="mailto:${escapeHtml(guest.email)}" style="color:#244537">${escapeHtml(guest.email)}</a><br>${escapeHtml(guest.phone)}</td></tr></table>`
    : `<p style="margin:0 0 20px;color:#555b56;font-size:14px;line-height:1.7">Hello ${name},<br>Thank you for choosing Rafiki Airbnbs. We’ve received your booking request, and our team will contact you to confirm the details of your stay.</p>`;
  const reference = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f5f2e9;border:1px solid #ebe4d3;border-radius:10px"><tr><td style="padding:14px 18px"><div style="color:#696d68;font-size:11px;text-transform:uppercase;letter-spacing:1px">Booking reference</div><div style="margin-top:4px;color:#244537;font-size:20px;font-weight:bold;letter-spacing:1px">${ref}</div></td><td align="right" style="padding:14px 18px"><span style="display:inline-block;background:#e8f0eb;color:#244537;border-radius:20px;padding:6px 10px;font-size:11px;font-weight:bold;text-transform:uppercase">${status}</span></td></tr></table>`;
  const detailRows = [
    ['Stay', `${propertyName}${location ? `<br><span style="color:#777b75;font-size:12px">${location}</span>` : ''}`],
    ['Check-in', checkIn],
    ['Check-out', checkOut],
    ['Guests', escapeHtml(booking.guests_count)],
    ['Estimated total', escapeHtml(amount)],
  ]
    .map(
      ([label, value], index) =>
        `<tr><td style="padding:13px 14px;border-bottom:${index === 4 ? '0' : '1px solid #ebe9e3'};color:#686d67;font-size:13px">${label}</td><td align="right" style="padding:13px 14px;border-bottom:${index === 4 ? '0' : '1px solid #ebe9e3'};color:#1a1d1b;font-size:13px;font-weight:${index === 4 ? 'bold' : 'normal'}">${value}</td></tr>`
    )
    .join('');
  const details = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ebe9e3;border-radius:10px;border-spacing:0;overflow:hidden">${detailRows}</table>`;
  const requests = booking.special_requests
    ? `<div style="margin-top:18px;padding:14px 16px;background:#f7f6f2;border-left:3px solid #b89758;border-radius:4px"><div style="margin-bottom:5px;color:#686d67;font-size:11px;text-transform:uppercase;letter-spacing:.7px">Special requests</div><div style="color:#303530;font-size:13px;line-height:1.6">${escapeHtml(booking.special_requests)}</div></div>`
    : '';
  const subject = safeHeader(
    isAdminCopy
      ? `New booking request ${booking.reference_number} - ${property.name}`
      : `Your Rafiki Airbnbs booking request ${booking.reference_number}`
  );
  const text = [
    isAdminCopy ? `NEW BOOKING REQUEST — ${property.name}` : `Hello ${guest.full_name},`,
    '',
    isAdminCopy
      ? `Guest: ${guest.full_name}\nEmail: ${guest.email}\nPhone: ${guest.phone}`
      : 'Thank you for choosing Rafiki Airbnbs. We have received your booking request.',
    '',
    'BOOKING DETAILS',
    '----------------',
    `Booking reference: ${booking.reference_number}`,
    `Stay: ${property.name}${location ? ` (${property.location}, ${property.city})` : ''}`,
    `Check-in:  ${formatDate(booking.check_in)}`,
    `Check-out: ${formatDate(booking.check_out)}`,
    `Guests: ${booking.guests_count}`,
    `Estimated total: ${amount}`,
    `Status: ${booking.status}`,
    booking.special_requests ? `Special requests: ${booking.special_requests}` : '',
    '',
    tagline,
    'Rafiki Airbnbs · Nairobi, Kenya',
  ]
    .filter(Boolean)
    .join('\n');

  const summaryHtml = `${reference}${details}`;
  return {
    subject,
    text,
    summaryHtml,
    html: emailShell(
      `<h1 style="margin:0 0 12px;color:#1a1d1b;font-family:Georgia,serif;font-size:27px;font-weight:normal;line-height:1.25">${isAdminCopy ? 'New booking request' : 'Your request is in'}</h1>${greeting}${summaryHtml}${requests}${isAdminCopy ? '' : '<p style="margin:22px 0 0;color:#555b56;font-size:13px;line-height:1.6">Please keep this email for your records. Your booking is not confirmed until our team contacts you.</p>'}`,
      tagline
    ),
  };
}

function recoveryEmail(bookings, tagline) {
  const name = escapeHtml(bookings[0].guest.full_name);
  const sections = bookings
    .map(({ booking, guest }) => {
      const email = bookingEmail(booking, booking.properties, guest, tagline);
      return `<section style="margin-top:22px;padding-top:22px;border-top:1px solid #ebe9e3"><h2 style="margin:0 0 12px;color:#244537;font-size:16px">${escapeHtml(booking.properties.name)}</h2>${email.summaryHtml}</section>`;
    })
    .join('');
  const text = [
    `Hello ${bookings[0].guest.full_name},`,
    '',
    'Here are the booking details associated with this email address.',
    ...bookings.flatMap(({ booking }) => [
      '',
      '------------------------------',
      `Booking reference: ${booking.reference_number}`,
      `Stay: ${booking.properties.name}`,
      `Check-in:  ${formatDate(booking.check_in)}`,
      `Check-out: ${formatDate(booking.check_out)}`,
      `Guests: ${booking.guests_count}`,
      `Estimated total: KES ${Number(booking.estimated_total).toLocaleString('en-KE')}`,
      `Status: ${booking.status}`,
    ]),
    '',
    tagline,
    'Rafiki Airbnbs · Nairobi, Kenya',
  ].join('\n');
  return {
    subject: 'Your Rafiki Airbnbs booking details',
    text,
    html: emailShell(
      `<h1 style="margin:0 0 12px;color:#1a1d1b;font-family:Georgia,serif;font-size:27px;font-weight:normal">Your booking details</h1><p style="margin:0;color:#555b56;font-size:14px;line-height:1.7">Hello ${name}, here are the bookings associated with your email address.</p>${sections}`,
      tagline
    ),
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
  const [adminRecipients, tagline] = await Promise.all([
    getAdminRecipients(),
    getCompanyTagline(),
  ]);
  const results = await Promise.allSettled([
    mailer.sendMail({
      from: { name: 'Rafiki Airbnbs', address: smtpUser },
      to: guest.email,
      ...bookingEmail(booking, property, guest, tagline),
    }),
    mailer.sendMail({
      from: { name: 'Rafiki Airbnbs Bookings', address: smtpUser },
      to: smtpUser,
      bcc: adminRecipients.filter(
        (recipient) => recipient !== smtpUser.trim().toLowerCase()
      ),
      ...bookingEmail(booking, property, guest, tagline, true),
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
    const tagline = await getCompanyTagline();
    await mailer.sendMail({
      from: { name: 'Rafiki Airbnbs', address: smtpUser },
      to: email,
      ...recoveryEmail(bookings, tagline),
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
