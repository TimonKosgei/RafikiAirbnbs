import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { WhatsAppButton } from '../components/ui/ContactButtons';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRafiki();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center space-y-6">
      <p className="text-xs font-medium text-[#2C4C3E]">404 · Page Not Found</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B]">
        Stay not found
      </h1>
      <p className="text-base text-[#4A4E48] max-w-md mx-auto leading-relaxed">
        This page or property may have been moved or is currently unavailable.
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
          <ArrowRight className="w-4 h-4" />
        </a>
        <WhatsAppButton label="Chat with Rafiki Airbnbs" variant="outline" />
      </div>
    </div>
  );
};
