import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { useRafiki } from '../../context/RafikiContext';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeTelLink,
  WhatsAppMessages,
} from '../../lib/whatsapp';

interface WhatsAppButtonProps {
  message?: string;
  phoneOverride?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'subtle';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  message,
  phoneOverride,
  label = 'Chat with MIS Stays',
  variant = 'primary',
  className = '',
  size = 'md',
}) => {
  const { settings } = useRafiki();
  const targetPhone = phoneOverride || settings.whatsapp_number;
  const finalMessage = message ?? WhatsAppMessages.generalInquiry();
  const whatsappHref = buildWhatsAppUrl(targetPhone, finalMessage);

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#2C4C3E] text-white hover:bg-[#223B30] border border-transparent shadow-xs',
    secondary:
      'bg-[#F2EFE9] text-[#1A1D1B] hover:bg-[#E6E1D6] border border-[#1A1D1B]/10',
    outline:
      'bg-transparent text-[#1A1D1B] border border-[#1A1D1B]/25 hover:border-[#2C4C3E] hover:text-[#2C4C3E]',
    subtle:
      'bg-white/95 text-[#1A1D1B] hover:bg-white border border-white/20',
  }[variant];

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C4C3E] ${sizeStyles} ${variantStyles} ${className}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </a>
  );
};

interface PhoneCallButtonProps {
  phoneOverride?: string;
  label?: string;
  showNumber?: boolean;
  variant?: 'outline' | 'secondary' | 'primary';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PhoneCallButton: React.FC<PhoneCallButtonProps> = ({
  phoneOverride,
  label = 'Call MIS Stays',
  showNumber = false,
  variant = 'outline',
  className = '',
  size = 'md',
}) => {
  const { settings } = useRafiki();
  const rawPhone = phoneOverride || settings.phone_number || settings.whatsapp_number;
  const telHref = normalizeTelLink(rawPhone);
  const displayNum = formatDisplayPhone(rawPhone);

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-[#1A1D1B] text-white hover:bg-[#2E3330] border border-transparent',
    secondary: 'bg-[#F2EFE9] text-[#1A1D1B] hover:bg-[#E6E1D6] border border-[#1A1D1B]/10',
    outline:
      'bg-transparent text-[#1A1D1B] border border-[#1A1D1B]/20 hover:border-[#1A1D1B] hover:bg-[#1A1D1B]/5',
  }[variant];

  return (
    <a
      href={telHref}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C4C3E] ${sizeStyles} ${variantStyles} ${className}`}
    >
      <Phone className="w-4 h-4 shrink-0" />
      <span>{showNumber ? `${label} (${displayNum})` : label}</span>
    </a>
  );
};

export const FloatingMobileWhatsApp: React.FC = () => {
  const { settings, pathname } = useRafiki();
  if (pathname.startsWith('/admin')) return null;

  const href = buildWhatsAppUrl(settings.whatsapp_number, WhatsAppMessages.generalInquiry());

  return (
    <div className="fixed bottom-4 right-4 z-40 md:hidden">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MIS Stays on WhatsApp"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2C4C3E] text-white text-xs font-medium shadow-md hover:bg-[#223B30] transition-transform duration-150 active:scale-95"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp Concierge</span>
      </a>
    </div>
  );
};
