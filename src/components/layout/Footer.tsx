import React from 'react';
import { useRafiki } from '../../context/RafikiContext';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeTelLink,
  WhatsAppMessages,
} from '../../lib/whatsapp';

export const Footer: React.FC = () => {
  const { settings, properties, navigate } = useRafiki();

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    WhatsAppMessages.generalInquiry()
  );
  const telUrl = normalizeTelLink(settings.phone_number || settings.whatsapp_number);
  const displayPhone = formatDisplayPhone(settings.phone_number || settings.whatsapp_number);

  return (
    <footer className="bg-[#1A1D1B] text-[#FBF9F5] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-14 border-b border-white/10">
          <div className="lg:col-span-5 space-y-4">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="font-serif text-3xl font-semibold tracking-tight text-[#FBF9F5] inline-block"
            >
              MIS Stays
            </a>
            <p className="text-sm text-[#D6D3CD] max-w-sm leading-relaxed tracking-wide">
              &ldquo;Rafiki&rdquo; means friend in Swahili. We offer a small, thoughtfully managed
              collection of short-stay residences in Nairobi—combining boutique comfort with warm,
              personal Kenyan hospitality.
            </p>
            <p className="font-serif italic text-lg text-[#B89758]">
              {settings.company_tagline || 'Where Every Stay Feels Like Home.'}
            </p>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#B89758]">
              Curated Stays
            </h3>
            <ul className="space-y-2.5 text-sm text-[#D6D3CD]">
              {properties.slice(0, 5).map((prop) => (
                <li key={prop.id}>
                  <a
                    href={`/stays/${prop.slug}`}
                    onClick={(e) => handleLink(e, `/stays/${prop.slug}`)}
                    className="hover:text-white transition-colors"
                  >
                    {prop.name} · {prop.location}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/stays"
                  onClick={(e) => handleLink(e, '/stays')}
                  className="text-[#B89758] hover:underline"
                >
                  Explore all stays
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#B89758]">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-[#D6D3CD]">
              <li>
                <a
                  href="/destinations"
                  onClick={(e) => handleLink(e, '/destinations')}
                  className="hover:text-white transition-colors"
                >
                  Destinations
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLink(e, '/contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Concierge
                </a>
              </li>
              <li>
                <a
                  href="/booking"
                  onClick={(e) => handleLink(e, '/booking')}
                  className="hover:text-white transition-colors"
                >
                  Booking Lookup
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  onClick={(e) => handleLink(e, '/admin')}
                  className="hover:text-white transition-colors"
                >
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#B89758]">
              Direct Contact
            </h3>
            <div className="space-y-2.5 text-sm text-[#D6D3CD]">
              <p className="leading-relaxed">{settings.office_address}</p>
              <p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline underline-offset-4 transition-colors"
                >
                  WhatsApp Concierge
                </a>
              </p>
              <p>
                <a
                  href={telUrl}
                  className="hover:text-white font-mono-num transition-colors"
                >
                  {displayPhone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${settings.support_email}`}
                  className="hover:text-white transition-colors"
                >
                  {settings.support_email}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#9E9B95]">
          <p>© {new Date().getFullYear()} MIS Stays. Nairobi, Kenya. All rights reserved.</p>
          <p>Personal WhatsApp &amp; phone confirmation for every stay.</p>
        </div>
      </div>
    </footer>
  );
};
