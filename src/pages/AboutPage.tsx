import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { ResilientImage } from '../components/ui/ResilientImage';
import { WhatsAppButton, PhoneCallButton } from '../components/ui/ContactButtons';
import { WhatsAppMessages } from '../lib/whatsapp';

export const AboutPage: React.FC = () => {
  const { navigate } = useRafiki();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-20 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs font-medium text-[#2C4C3E]">
            Our Story · Karibu
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#1A1D1B] leading-[1.1] tracking-tight">
            Where Every Stay Feels Like Home.
          </h1>
          <p className="text-base sm:text-lg text-[#363935] leading-relaxed">
            MIS Stays was founded on a simple idea: arriving in Kenya—whether for a safari, a new
            chapter abroad, or a week of work—should feel welcoming, comfortable, and personal.
          </p>
          <p className="text-sm sm:text-base text-[#4A4E48] leading-relaxed">
            Rather than operating hundreds of anonymous listings, we curate a deliberately intimate
            collection of residences in Nairobi’s finest neighborhoods. Every home is prepared by
            our in-house hospitality team with crisp organic linens, locally roasted Kenyan AA
            coffee, reliable fiber internet, and 24-hour security.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/stays"
              onClick={(e) => {
                e.preventDefault();
                navigate('/stays');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2C4C3E] text-white text-sm font-semibold hover:bg-[#223B30] transition-colors"
            >
              <span>Explore our stays</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <WhatsAppButton
              label="Chat with our team"
              variant="outline"
              size="md"
              message={WhatsAppMessages.generalInquiry()}
            />
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#F2EFE9] border border-[#1A1D1B]/10">
            <ResilientImage
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
              alt="Rafiki Haven garden veranda in Nairobi"
              fallbackLabel="Rafiki Haven Garden Residence"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
