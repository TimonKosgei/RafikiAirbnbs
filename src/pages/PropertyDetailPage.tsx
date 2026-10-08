import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  Clock,
  Coffee,
  Laptop,
  MapPin,
  ShieldCheck,
  Shirt,
  Star,
  Sun,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { ResilientImage } from '../components/ui/ResilientImage';
import { WhatsAppButton, PhoneCallButton } from '../components/ui/ContactButtons';
import {
  datesOverlap,
  formatKES,
  formatShortDate,
  validateBookingDates,
} from '../lib/bookings/validation';
import { WhatsAppMessages } from '../lib/whatsapp';
import { apiFetch } from '../lib/supabase/client';
import { BookingRequest } from '../types';
import { KENYA_DESTINATIONS_META } from '../lib/supabase/seed-data';

function getAmenityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet'))
    return Wifi;
  if (lower.includes('workspace') || lower.includes('desk') || lower.includes('office'))
    return Laptop;
  if (lower.includes('pool') || lower.includes('swim')) return Waves;
  if (lower.includes('parking') || lower.includes('car')) return Car;
  if (lower.includes('kitchen') || lower.includes('dining')) return Utensils;
  if (lower.includes('tv') || lower.includes('television')) return Tv;
  if (lower.includes('air conditioning') || lower.includes('ac') || lower.includes('fan'))
    return Wind;
  if (lower.includes('washing') || lower.includes('laundry') || lower.includes('dryer'))
    return Shirt;
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard'))
    return ShieldCheck;
  if (lower.includes('generator') || lower.includes('power') || lower.includes('inverter'))
    return Zap;
  if (lower.includes('balcony') || lower.includes('veranda') || lower.includes('terrace'))
    return Sun;
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('breakfast'))
    return Coffee;
  return Check;
}

export const PropertyDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const {
    properties,
    reviews,
    confirmedDateBlocks,
    searchParams,
    navigate,
    refreshPublicData,
  } = useRafiki();

  const property = useMemo(
    () => properties.find((p) => p.slug === slug),
    [properties, slug]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '2026-11-10');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '2026-11-14');
  const [guestsCount, setGuestsCount] = useState(
    Number(searchParams.get('guests')) || 2
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center space-y-6">
        <p className="text-xs font-medium text-[#2C4C3E]">404 · Residence Unavailable</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B]">
          Stay not found
        </h1>
        <p className="text-base text-[#4A4E48] max-w-md mx-auto leading-relaxed">
          This property may have been removed or is currently unavailable.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/stays"
            onClick={(e) => {
              e.preventDefault();
              navigate('/stays');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2C4C3E] text-white text-sm font-semibold hover:bg-[#223B30] transition-colors"
          >
            <span>Explore our stays</span>
          </a>
          <WhatsAppButton label="Chat with MIS Stays" variant="outline" />
        </div>
      </div>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ id: '1', property_id: property.id, url: '', alt: property.name, is_cover: true, display_order: 0 }];

  const safeIdx = activeImageIdx < images.length ? activeImageIdx : 0;
  const propertyReviews = reviews.filter((r) => r.property_id === property.id && r.published);
  const propertyConfirmedBlocks = confirmedDateBlocks.filter((b) => b.property_id === property.id);

  const dateValidation = validateBookingDates(checkIn, checkOut);
  const overlappingConfirmed =
    dateValidation.valid &&
    propertyConfirmedBlocks.find((b) =>
      datesOverlap(checkIn, checkOut, b.check_in, b.check_out)
    );

  const totalNights = dateValidation.valid ? dateValidation.nights : 0;
  const estimatedTotal = totalNights * property.price_per_night;
  const destMeta = KENYA_DESTINATIONS_META[property.location];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!dateValidation.valid) {
      setSubmitError(dateValidation.error || 'Please select valid check-in and check-out dates.');
      return;
    }

    if (overlappingConfirmed) {
      setSubmitError(
        `These dates overlap with an already confirmed stay (${formatShortDate(
          overlappingConfirmed.check_in
        )} – ${formatShortDate(overlappingConfirmed.check_out)}). Please choose different dates.`
      );
      return;
    }

    if (guestsCount < 1 || guestsCount > property.max_guests) {
      setSubmitError(
        `Please select between 1 and ${property.max_guests} guests for ${property.name}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch<{
        booking: BookingRequest;
        emailNotificationFailed?: boolean;
      }>('/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify({
          property_id: property.id,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guestsCount,
          full_name: fullName,
          email,
          phone,
          special_requests: specialRequests,
        }),
      });

      await refreshPublicData();
      navigate(
        `/booking/${response.booking.reference_number}${
          response.emailNotificationFailed ? '?emailNotificationFailed=1' : ''
        }`
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Please try again or contact us directly on WhatsApp.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <a
          href="/stays"
          onClick={(e) => {
            e.preventDefault();
            navigate('/stays');
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#4A4E48] hover:text-[#1A1D1B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all stays</span>
        </a>

        {property.is_demo && (
          <p className="text-xs text-[#7A776E] italic">
            Demo property details · Editable via Admin Dashboard
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-[#5C5F58]">
            <span className="font-semibold text-[#2C4C3E]">
              {property.location}, {property.city}, {property.country}
            </span>
            <span aria-hidden="true">·</span>
            <span>{property.property_type}</span>
            {property.rating && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#1A1D1B] tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-[#B89758] text-[#B89758]" />
                  {property.rating.toFixed(1)} ({propertyReviews.length}{' '}
                  {propertyReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </>
            )}
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B] tracking-tight">
            {property.name}
          </h1>

          <p className="text-sm text-[#4A4E48] tabular-nums">
            <span>Up to {property.max_guests} guests</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              {property.beds} {property.beds === 1 ? 'bed' : 'beds'}
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              {property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WhatsAppButton
            label={`Ask about ${property.name}`}
            variant="outline"
            size="md"
            message={WhatsAppMessages.propertyInquiry(property.name, checkIn, checkOut)}
          />
        </div>
      </div>

      {/* Gallery Showcase */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8 relative aspect-16/10 rounded-xl overflow-hidden bg-[#F2EFE9]">
            <ResilientImage
              src={images[safeIdx].url}
              alt={images[safeIdx].alt || property.name}
              fallbackLabel={property.name}
              priority
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-3">
            {images.slice(0, 3).map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={`relative aspect-4/3 lg:aspect-16/9 rounded-xl overflow-hidden bg-[#F2EFE9] border-2 transition-all cursor-pointer ${
                  safeIdx === idx
                    ? 'border-[#2C4C3E] opacity-100'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <ResilientImage
                  src={img.url}
                  alt={img.alt || `${property.name} view ${idx + 1}`}
                  fallbackLabel={`${property.name} #${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Details & Booking Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-4">
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-4 border-b border-[#1A1D1B]/10 pb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
              About this stay
            </h2>
            <p className="text-base text-[#363935] leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </section>

          <section className="space-y-5 border-b border-[#1A1D1B]/10 pb-10">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
                What this place offers
              </h2>
              <p className="text-xs text-[#5C5F58] mt-1">
                Verified amenities included with your stay at {property.name}
              </p>
            </div>

            {property.amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {property.amenities.map((amenity) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3.5 rounded-lg bg-[#F2EFE9]/70 border border-[#1A1D1B]/6"
                    >
                      <IconComponent className="w-4 h-4 text-[#2C4C3E] shrink-0" />
                      <span className="text-sm font-medium text-[#1A1D1B]">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#5C5F58]">
                Contact our concierge for the full inventory list of this residence.
              </p>
            )}
          </section>

          <section className="space-y-4 border-b border-[#1A1D1B]/10 pb-10">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
                Location · {property.location}, {property.city}
              </h2>
              <p className="text-xs text-[#5C5F58]">
                For guest security and privacy, the exact compound gate and apartment number are
                shared directly after your booking is confirmed.
              </p>
            </div>

            <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2C4C3E] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-[#1A1D1B]">
                    {property.location} Neighborhood Guide
                  </h3>
                  <p className="text-sm text-[#363935] leading-relaxed">
                    {property.neighborhood_overview ||
                      destMeta?.description ||
                      `Set in a quiet, secure residential enclave of ${property.location}, ${property.city}.`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5 border-b border-[#1A1D1B]/10 pb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
              House Rules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#F2EFE9] border border-[#1A1D1B]/8 flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#2C4C3E] shrink-0" />
                <div>
                  <span className="text-xs text-[#5C5F58] block">Check-in time</span>
                  <span className="text-sm font-semibold text-[#1A1D1B] tabular-nums">
                    From {property.check_in_time}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F2EFE9] border border-[#1A1D1B]/8 flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#2C4C3E] shrink-0" />
                <div>
                  <span className="text-xs text-[#5C5F58] block">Check-out time</span>
                  <span className="text-sm font-semibold text-[#1A1D1B] tabular-nums">
                    By {property.check_out_time}
                  </span>
                </div>
              </div>
            </div>

            <dl className="divide-y divide-[#1A1D1B]/8 text-sm">
              <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="font-medium text-[#5C5F58]">Smoking policy</dt>
                <dd className="text-[#1A1D1B] sm:text-right">{property.house_rules.smoking}</dd>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="font-medium text-[#5C5F58]">Pets policy</dt>
                <dd className="text-[#1A1D1B] sm:text-right">{property.house_rules.pets}</dd>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="font-medium text-[#5C5F58]">Parties &amp; events</dt>
                <dd className="text-[#1A1D1B] sm:text-right">{property.house_rules.parties}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
              Guest Reviews
            </h2>

            {propertyReviews.length > 0 ? (
              <div className="space-y-4">
                {propertyReviews.map((rev) => (
                  <blockquote
                    key={rev.id}
                    className="p-5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/8 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C5F58]">
                      <div>
                        <strong className="text-[#1A1D1B] font-semibold">
                          {rev.guest_name}
                        </strong>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>{rev.guest_origin}</span>
                      </div>
                      <span className="tabular-nums">{rev.stay_date}</span>
                    </div>
                    <p className="text-sm text-[#1A1D1B] leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5C5F58]">
                New residence in our collection—guest reflections will appear here soon.
              </p>
            )}
          </section>
        </div>

        {/* Booking Request Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/12 p-6 sm:p-7 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#1A1D1B]/10 pb-4">
              <div>
                <span className="text-2xl font-semibold text-[#1A1D1B] font-mono-num">
                  {formatKES(property.price_per_night)}
                </span>
                <span className="text-sm text-[#5C5F58]"> / night</span>
              </div>
              <span className="text-xs text-[#2C4C3E] font-medium">
                Max {property.max_guests} guests
              </span>
            </div>

            {propertyConfirmedBlocks.length > 0 && (
              <div className="p-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/10 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#1A1D1B]">
                  <Calendar className="w-3.5 h-3.5 text-[#2C4C3E]" />
                  <span>Confirmed unavailable dates:</span>
                </div>
                <p className="text-[#5C5F58] tabular-nums">
                  {propertyConfirmedBlocks
                    .map(
                      (b) =>
                        `${formatShortDate(b.check_in)} → ${formatShortDate(
                          b.check_out,
                          true
                        )}`
                    )
                    .join(' · ')}
                </p>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="book-checkin"
                    className="block text-xs font-medium text-[#4A4E48] mb-1"
                  >
                    Check-in *
                  </label>
                  <input
                    id="book-checkin"
                    type="date"
                    required
                    value={checkIn}
                    min="2026-10-08"
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-xs font-mono-num text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="book-checkout"
                    className="block text-xs font-medium text-[#4A4E48] mb-1"
                  >
                    Check-out *
                  </label>
                  <input
                    id="book-checkout"
                    type="date"
                    required
                    value={checkOut}
                    min={checkIn || '2026-10-09'}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-xs font-mono-num text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="book-guests"
                  className="block text-xs font-medium text-[#4A4E48] mb-1"
                >
                  Guests *
                </label>
                <select
                  id="book-guests"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] tabular-nums focus:border-[#2C4C3E] focus:outline-none"
                >
                  {Array.from({ length: property.max_guests }).map((_, i) => {
                    const count = i + 1;
                    return (
                      <option key={count} value={count}>
                        {count} {count === 1 ? 'guest' : 'guests'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="book-fullname"
                  className="block text-xs font-medium text-[#4A4E48] mb-1"
                >
                  Full name *
                </label>
                <input
                  id="book-fullname"
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="book-email"
                  className="block text-xs font-medium text-[#4A4E48] mb-1"
                >
                  Email address *
                </label>
                <input
                  id="book-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="book-phone"
                  className="block text-xs font-medium text-[#4A4E48] mb-1"
                >
                  WhatsApp / Phone number *
                </label>
                <input
                  id="book-phone"
                  type="tel"
                  required
                  placeholder="e.g. +254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] font-mono-num focus:border-[#2C4C3E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="book-requests"
                  className="block text-xs font-medium text-[#4A4E48] mb-1"
                >
                  Special requests
                </label>
                <textarea
                  id="book-requests"
                  rows={2}
                  placeholder="Flight arrival time, airport transfer, etc."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
                />
              </div>

              {totalNights > 0 && !overlappingConfirmed && (
                <div className="p-4 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/8 space-y-2 text-xs">
                  <div className="flex justify-between text-[#4A4E48] tabular-nums">
                    <span>
                      {formatKES(property.price_per_night)} × {totalNights}{' '}
                      {totalNights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="font-mono-num">{formatKES(estimatedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#4A4E48]">
                    <span>Direct concierge support</span>
                    <span className="text-[#2C4C3E] font-medium">Included</span>
                  </div>
                  <div className="pt-2 border-t border-[#1A1D1B]/10 flex justify-between text-sm font-semibold text-[#1A1D1B] tabular-nums">
                    <span>Estimated Total</span>
                    <span className="font-mono-num">{formatKES(estimatedTotal)}</span>
                  </div>
                </div>
              )}

              {(submitError || overlappingConfirmed) && (
                <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-xs text-[#991B1B]">
                  {submitError || 'Dates conflict with an existing reservation.'}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || Boolean(overlappingConfirmed)}
                className="w-full py-3.5 px-6 rounded-lg bg-[#2C4C3E] hover:bg-[#223B30] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting Booking Request...' : 'Request to Book'}
              </button>

              <p className="text-xs text-[#5C5F58] leading-relaxed text-center">
                Your booking isn&apos;t confirmed yet. We&apos;ll contact you via WhatsApp or phone
                to confirm availability and finalize your stay.
              </p>
            </form>

            <div className="pt-4 border-t border-[#1A1D1B]/10 flex flex-col sm:flex-row gap-2.5">
              <WhatsAppButton
                label="Chat on WhatsApp"
                variant="secondary"
                size="sm"
                className="flex-1"
                message={WhatsAppMessages.propertyInquiry(property.name, checkIn, checkOut)}
              />
              <PhoneCallButton
                label="Call Us"
                variant="outline"
                size="sm"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
