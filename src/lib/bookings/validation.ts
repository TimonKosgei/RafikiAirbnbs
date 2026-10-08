import { BookingRequest } from '../../types';

export interface DateValidationResult {
  valid: boolean;
  error?: string;
  nights: number;
}

export function validateBookingDates(checkIn: string, checkOut: string): DateValidationResult {
  if (!checkIn || !checkOut) {
    return { valid: false, error: 'Please select both check-in and check-out dates.', nights: 0 };
  }

  const inDate = new Date(`${checkIn}T00:00:00`);
  const outDate = new Date(`${checkOut}T00:00:00`);

  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
    return { valid: false, error: 'Invalid date format provided.', nights: 0 };
  }

  const diffMs = outDate.getTime() - inDate.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return {
      valid: false,
      error: 'Check-out date must be at least 1 night after the check-in date.',
      nights: 0,
    };
  }

  if (nights > 180) {
    return {
      valid: false,
      error: 'For stays longer than 180 nights, please contact Rafiki Living directly via WhatsApp.',
      nights: 0,
    };
  }

  return { valid: true, nights };
}

export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

export function findConflictingConfirmedBookings(
  allBookings: BookingRequest[],
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): BookingRequest[] {
  return allBookings.filter((b) => {
    if (b.property_id !== propertyId) return false;
    if (b.status !== 'confirmed') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    return datesOverlap(checkIn, checkOut, b.check_in, b.check_out);
  });
}

export function formatShortDate(dateStr: string, includeYear = false): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

export function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}
