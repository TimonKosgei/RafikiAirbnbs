export function normalizeWhatsAppNumber(rawNumber: string): string {
  if (!rawNumber) return '254712345678';
  const digitsOnly = rawNumber.replace(/\D/g, '');
  if (!digitsOnly) return '254712345678';

  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return `254${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.length === 9 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('1'))) {
    return `254${digitsOnly}`;
  }

  return digitsOnly;
}

export function normalizeTelLink(rawPhone: string): string {
  const intl = normalizeWhatsAppNumber(rawPhone);
  return `tel:+${intl}`;
}

export function formatDisplayPhone(rawPhone: string): string {
  const intl = normalizeWhatsAppNumber(rawPhone);
  if (intl.startsWith('254') && intl.length === 12) {
    return `+254 ${intl.slice(3, 6)} ${intl.slice(6, 9)} ${intl.slice(9)}`;
  }
  return rawPhone.startsWith('+') ? rawPhone : `+${intl}`;
}

export function buildWhatsAppUrl(rawNumber: string, message?: string): string {
  const cleanIntl = normalizeWhatsAppNumber(rawNumber);
  const baseUrl = `https://wa.me/${cleanIntl}`;
  if (!message || !message.trim()) {
    return baseUrl;
  }
  return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
}

export const WhatsAppMessages = {
  generalInquiry: () =>
    `Hello Rafiki Airbnbs, I would like to inquire about your short-stay residences in Kenya.`,

  propertyInquiry: (propertyName: string, checkIn?: string, checkOut?: string) => {
    if (checkIn && checkOut) {
      return `Hello Rafiki Airbnbs, I'm interested in booking ${propertyName} from ${checkIn} to ${checkOut}.`;
    }
    return `Hello Rafiki Airbnbs, I'm interested in booking ${propertyName}.`;
  },

  guestBookingConfirmation: (
    propertyName: string,
    checkIn: string,
    checkOut: string,
    guestName: string,
    referenceNumber?: string
  ) => {
    const refSuffix = referenceNumber ? ` (Reference: ${referenceNumber})` : '';
    return `Hello Rafiki Airbnbs, I have submitted a booking request for ${propertyName} from ${checkIn} to ${checkOut}. My name is ${guestName}.${refSuffix}`;
  },

  adminToGuestReply: (
    guestFullName: string,
    propertyName: string,
    checkInFormatted: string,
    checkOutFormatted: string,
    referenceNumber?: string
  ) => {
    const firstName = guestFullName.trim().split(/\s+/)[0] || guestFullName;
    const refPart = referenceNumber ? ` (Ref: ${referenceNumber})` : '';
    return `Hello ${firstName}, this is Rafiki Airbnbs regarding your booking request for ${propertyName} from ${checkInFormatted} to ${checkOutFormatted}${refPart}.`;
  },
};
