import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Mail, Search, XCircle } from 'lucide-react';
import { BookingRequest } from '../types';
import { apiFetch } from '../lib/supabase/client';
import { WhatsAppButton, PhoneCallButton } from '../components/ui/ContactButtons';
import { formatKES, formatLongDate } from '../lib/bookings/validation';
import { WhatsAppMessages } from '../lib/whatsapp';
import { useRafiki } from '../context/RafikiContext';

interface PublicBookingLookupResponse {
  booking: Omit<BookingRequest, 'admin_notes'>;
  property: {
    id: string;
    name: string;
    slug: string;
    location: string;
    city: string;
    check_in_time: string;
    check_out_time: string;
    cover_image: string;
  } | null;
}

export const BookingConfirmationPage: React.FC<{ bookingIdOrRef: string }> = ({
  bookingIdOrRef,
}) => {
  const { navigate, searchParams } = useRafiki();
  const [data, setData] = useState<PublicBookingLookupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookupInput, setLookupInput] = useState(bookingIdOrRef || '');
  const [emailInput, setEmailInput] = useState('');
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [emailLookupMessage, setEmailLookupMessage] = useState<string | null>(null);
  const [emailLookupError, setEmailLookupError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBooking() {
      if (!bookingIdOrRef) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<PublicBookingLookupResponse>(
          `/api/public/bookings/${encodeURIComponent(bookingIdOrRef)}`
        );
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not find a booking request with that reference.'
          );
          setData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingIdOrRef]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    navigate(`/booking/${encodeURIComponent(lookupInput.trim())}`);
  };

  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLookupMessage(null);
    setEmailLookupError(null);
    setEmailLookupLoading(true);
    try {
      const response = await apiFetch<{ message: string }>(
        '/api/public/bookings/lookup-by-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: emailInput }),
        }
      );
      setEmailLookupMessage(response.message);
    } catch (err) {
      setEmailLookupError(
        err instanceof Error ? err.message : 'Could not send booking recovery email.'
      );
    } finally {
      setEmailLookupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 space-y-6">
        <div className="h-8 w-64 bg-[#F2EFE9] rounded animate-pulse" />
        <div className="h-64 w-full bg-[#F2EFE9] rounded-xl animate-pulse" />
      </div>
    );
  }

  const booking = data?.booking;
  const property = data?.property;
  const firstName = booking?.guest_name.trim().split(/\s+/)[0] || 'Guest';

  const statusMeta: Record<
    string,
    { title: string; subtitle: string; tone: string; Icon: typeof Clock }
  > = {
    pending: {
      title: 'Booking Request Received',
      subtitle:
        'Our team will contact you via WhatsApp or phone to confirm availability and finalize your stay.',
      tone: 'text-[#B45309]',
      Icon: Clock,
    },
    contacted: {
      title: 'Concierge In Touch',
      subtitle:
        'Our hospitality team has reached out regarding your dates. Reply on WhatsApp to finalize confirmation.',
      tone: 'text-[#2C4C3E]',
      Icon: Clock,
    },
    confirmed: {
      title: 'Booking Confirmed',
      subtitle:
        'Your stay with MIS Stays is confirmed and your dates are reserved exclusively for you.',
      tone: 'text-[#15803D]',
      Icon: CheckCircle2,
    },
    cancelled: {
      title: 'Booking Request Cancelled',
      subtitle:
        'This booking request has been cancelled. Message us on WhatsApp if you would like to explore alternative dates.',
      tone: 'text-[#B91C1C]',
      Icon: XCircle,
    },
    completed: {
      title: 'Stay Completed',
      subtitle: 'Thank you for staying with MIS Stays. Karibu tena!',
      tone: 'text-[#2C4C3E]',
      Icon: CheckCircle2,
    },
  };

  const currentStatus = booking ? statusMeta[booking.status] || statusMeta.pending : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10 pb-24">
      <form
        onSubmit={handleLookupSubmit}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10"
      >
        <Search className="w-4 h-4 text-[#5C5F58] ml-2 shrink-0" />
        <input
          type="text"
          value={lookupInput}
          onChange={(e) => setLookupInput(e.target.value)}
          placeholder="Look up by booking reference (e.g. RFL-2026-0012)"
          className="flex-1 bg-transparent text-sm font-mono-num text-[#1A1D1B] focus:outline-none px-2"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#1A1D1B] text-white text-xs font-semibold hover:bg-[#2E3330] transition-colors cursor-pointer"
        >
          Find Request
        </button>
      </form>

      {error || !booking ? (
        <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 p-8 sm:p-10 text-center space-y-5">
          <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">
            {bookingIdOrRef ? 'Booking Request Not Found' : 'Find Your Booking'}
          </h1>
          <p className="text-sm text-[#4A4E48] max-w-md mx-auto">
            {error || 'Enter your booking reference above or request your booking details by email.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <WhatsAppButton label="Chat on WhatsApp" variant="primary" />
            <PhoneCallButton label="Call MIS Stays" variant="outline" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#FBF9F5] border border-[#1A1D1B]/12 overflow-hidden shadow-xs">
          {searchParams.get('emailNotificationFailed') === '1' && (
            <div className="m-6 sm:m-8 mb-0 rounded-lg border border-[#B45309]/30 bg-[#FFFBEB] p-4 text-sm text-[#92400E]">
              Your booking was saved, but we could not send the confirmation emails. Save the
              reference shown below and contact MIS Stays if you need help.
            </div>
          )}
          <div className="bg-[#F2EFE9] border-b border-[#1A1D1B]/10 p-6 sm:p-8 space-y-3">
            {currentStatus && (
              <div className={`inline-flex items-center gap-2 text-xs font-semibold ${currentStatus.tone}`}>
                <currentStatus.Icon className="w-4 h-4" />
                <span className="uppercase tracking-wider">Status: {booking.status}</span>
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1D1B]">
              {currentStatus?.title}
            </h1>

            <p className="text-base text-[#1A1D1B]">
              Thank you, <strong>{firstName}</strong>. Your request for{' '}
              <strong>{booking.property_name}</strong> has been received.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-[#5C5F58]">Reference: </span>
                <strong className="font-mono-num text-[#1A1D1B] bg-[#FBF9F5] px-2.5 py-1 rounded border border-[#1A1D1B]/12">
                  {booking.reference_number}
                </strong>
              </div>
              <div className="text-xs text-[#5C5F58]">
                Submitted {formatLongDate(booking.created_at.slice(0, 10))}
              </div>
            </div>

            <p className="text-sm text-[#4A4E48] pt-1">{currentStatus?.subtitle}</p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <dt className="text-xs text-[#5C5F58]">Check-in date</dt>
                <dd className="font-semibold text-[#1A1D1B] tabular-nums">
                  {formatLongDate(booking.check_in)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-[#5C5F58]">Check-out date</dt>
                <dd className="font-semibold text-[#1A1D1B] tabular-nums">
                  {formatLongDate(booking.check_out)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-[#5C5F58]">Guests &amp; duration</dt>
                <dd className="font-semibold text-[#1A1D1B] tabular-nums">
                  {booking.guests_count} guests · {booking.total_nights} nights
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-[#5C5F58]">Estimated total</dt>
                <dd className="font-semibold text-[#1A1D1B] font-mono-num">
                  {formatKES(booking.estimated_total)}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-[#1A1D1B]/10 space-y-4">
              <p className="text-xs text-[#5C5F58]">
                Message our team directly on WhatsApp with your reference number to confirm:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <WhatsAppButton
                  label="Chat on WhatsApp"
                  variant="primary"
                  size="lg"
                  message={WhatsAppMessages.guestBookingConfirmation(
                    booking.property_name,
                    booking.check_in,
                    booking.check_out,
                    booking.guest_name,
                    booking.reference_number
                  )}
                />
                <PhoneCallButton
                  label="Call MIS Stays"
                  showNumber
                  variant="outline"
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleEmailLookup}
        className="rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 p-5 sm:p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#2C4C3E]" />
          <h2 className="text-sm font-semibold text-[#1A1D1B]">Lost your booking reference?</h2>
        </div>
        <p className="text-xs text-[#5C5F58]">
          Enter the email address used for your booking. We’ll send any matching booking details
          to that inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            autoComplete="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="Email used for the booking"
            className="flex-1 h-10 rounded-lg border border-[#1A1D1B]/15 bg-white px-3 text-sm focus:border-[#2C4C3E] focus:outline-none"
          />
          <button
            type="submit"
            disabled={emailLookupLoading}
            className="h-10 px-4 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold hover:bg-[#223B30] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {emailLookupLoading ? 'Sending...' : 'Email my bookings'}
          </button>
        </div>
        {emailLookupMessage && (
          <p role="status" className="text-xs text-[#166534]">{emailLookupMessage}</p>
        )}
        {emailLookupError && (
          <p role="alert" className="text-xs text-[#991B1B]">{emailLookupError}</p>
        )}
      </form>
    </div>
  );
};
