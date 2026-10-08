import React, { useState } from 'react';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { WhatsAppButton, PhoneCallButton } from '../components/ui/ContactButtons';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeTelLink,
} from '../lib/whatsapp';

export const ContactPage: React.FC = () => {
  const { settings, properties } = useRafiki();
  const [guestName, setGuestName] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('General Inquiry');
  const [datesNote, setDatesNote] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const displayPhone = formatDisplayPhone(settings.phone_number || settings.whatsapp_number);
  const telHref = normalizeTelLink(settings.phone_number || settings.whatsapp_number);

  const composedWhatsAppText = [
    `Hello Rafiki Living, my name is ${guestName || 'a prospective guest'}.`,
    selectedProperty !== 'General Inquiry'
      ? `I'm inquiring about ${selectedProperty}.`
      : `I would like to inquire about your short-stay residences in Nairobi.`,
    datesNote ? `Preferred dates: ${datesNote}.` : '',
    customMessage ? customMessage : '',
  ]
    .filter(Boolean)
    .join(' ');

  const directWhatsAppUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    composedWhatsAppText
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 pb-24">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-medium text-[#2C4C3E]">
          Direct Hospitality Desk · Nairobi, Kenya
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B] tracking-tight">
          Get in Touch
        </h1>
        <p className="text-base text-[#4A4E48] leading-relaxed">
          Whether you have a question about long-stay corporate rates, airport transfers from Jomo
          Kenyatta International Airport, or choosing the right neighborhood, our team responds
          promptly on WhatsApp and phone.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-[#2C4C3E]" />
              <h2 className="font-serif text-2xl font-semibold text-[#1A1D1B]">
                WhatsApp Concierge
              </h2>
            </div>
            <p className="text-sm text-[#4A4E48] leading-relaxed">
              Our fastest channel for availability checks, arrival coordination, and guest support.
            </p>
            <p className="text-xs font-mono-num text-[#5C5F58]">
              International Format: +{settings.whatsapp_number}
            </p>
            <WhatsAppButton
              label="Chat with Rafiki Living"
              variant="primary"
              size="md"
              className="w-full"
            />
          </div>

          <div className="p-6 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#2C4C3E]" />
              <h2 className="font-serif text-2xl font-semibold text-[#1A1D1B]">
                Telephone Desk
              </h2>
            </div>
            <p className="text-sm text-[#4A4E48] leading-relaxed">
              Speak directly with our Nairobi hospitality coordinator.
            </p>
            <p className="text-base font-semibold font-mono-num text-[#1A1D1B]">
              <a href={telHref} className="hover:text-[#2C4C3E] transition-colors">
                {displayPhone}
              </a>
            </p>
            <PhoneCallButton
              label="Call Rafiki Living"
              variant="outline"
              size="md"
              className="w-full"
            />
          </div>

          <div className="p-6 rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/10 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#2C4C3E] shrink-0 mt-1" />
              <div>
                <span className="font-semibold text-[#1A1D1B] block">Nairobi Office</span>
                <span className="text-[#4A4E48]">{settings.office_address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-[#1A1D1B]/8">
              <Mail className="w-4 h-4 text-[#2C4C3E] shrink-0 mt-1" />
              <div>
                <span className="font-semibold text-[#1A1D1B] block">Email</span>
                <a
                  href={`mailto:${settings.support_email}`}
                  className="text-[#2C4C3E] hover:underline"
                >
                  {settings.support_email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-[#F2EFE9] border border-[#1A1D1B]/10 p-6 sm:p-10 space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl font-semibold text-[#1A1D1B]">
              Direct WhatsApp Inquiry
            </h2>
            <p className="text-sm text-[#4A4E48]">
              Prepare your message below to open WhatsApp with our team.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-medium text-[#4A4E48] mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-property"
                  className="block text-xs font-medium text-[#4A4E48] mb-1.5"
                >
                  Residence of Interest
                </label>
                <select
                  id="contact-property"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B]"
                >
                  <option value="General Inquiry">General Inquiry / All Properties</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-dates"
                className="block text-xs font-medium text-[#4A4E48] mb-1.5"
              >
                Approximate Dates
              </label>
              <input
                id="contact-dates"
                type="text"
                placeholder="e.g. Nov 12 – Nov 18"
                value={datesNote}
                onChange={(e) => setDatesNote(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B]"
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-medium text-[#4A4E48] mb-1.5"
              >
                Your Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                placeholder="Ask about availability, airport pickup, or anything else..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B]"
              />
            </div>

            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-lg bg-[#2C4C3E] hover:bg-[#223B30] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Message on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
