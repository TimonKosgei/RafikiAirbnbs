import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { KENYA_DESTINATIONS_META } from '../lib/supabase/seed-data';
import { ResilientImage } from '../components/ui/ResilientImage';
import { formatKES } from '../lib/bookings/validation';
import { WhatsAppButton } from '../components/ui/ContactButtons';
import { WhatsAppMessages } from '../lib/whatsapp';

export const DestinationsPage: React.FC = () => {
  const { properties, navigate } = useRafiki();

  const activeDestinationNames = Array.from(
    new Set(properties.map((p) => p.location))
  );

  const activeDestinations = activeDestinationNames.map((locationName) => {
    const propsInLocation = properties.filter((p) => p.location === locationName);
    const meta = KENYA_DESTINATIONS_META[locationName] || {
      city: propsInLocation[0]?.city || 'Nairobi',
      description: `Curated stays from MIS Stays in ${locationName}, ${propsInLocation[0]?.city || 'Kenya'}.`,
      highlights: ['Verified security', 'Personal WhatsApp concierge'],
      defaultImage: '',
    };

    const startingPrice = Math.min(...propsInLocation.map((p) => p.price_per_night));
    const coverImage =
      propsInLocation[0]?.images.find((i) => i.is_cover)?.url ||
      propsInLocation[0]?.images[0]?.url ||
      meta.defaultImage;

    return {
      location: locationName,
      city: propsInLocation[0]?.city || meta.city,
      description: meta.description,
      highlights: meta.highlights,
      properties: propsInLocation,
      startingPrice,
      coverImage,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-20 pb-24">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-medium text-[#2C4C3E]">
          Where We Host · Kenya
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B] tracking-tight">
          Our Kenyan Destinations
        </h1>
        <p className="text-base text-[#4A4E48] leading-relaxed">
          We only display destinations where we actively manage verified residences. Every
          neighborhood is selected for security, walkability, and effortless connections across
          Nairobi and beyond.
        </p>
      </div>

      <section className="space-y-10">
        <div className="border-b border-[#1A1D1B]/10 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1D1B]">
            Active Neighborhoods ({activeDestinations.length})
          </h2>
          <span className="text-xs text-[#5C5F58] tabular-nums">
            {properties.length} stays available now
          </span>
        </div>

        <div className="space-y-12">
          {activeDestinations.map((dest) => (
            <div
              key={dest.location}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-[#F2EFE9] border border-[#1A1D1B]/10 overflow-hidden p-6 sm:p-8"
            >
              <div className="lg:col-span-5 aspect-16/10 rounded-xl overflow-hidden bg-[#E5DFD3]">
                <ResilientImage
                  src={dest.coverImage}
                  alt={`${dest.location}, ${dest.city}`}
                  fallbackLabel={dest.location}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#5C5F58] tabular-nums">
                    <span className="font-semibold text-[#2C4C3E]">
                      {dest.city}, Kenya
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {dest.properties.length}{' '}
                      {dest.properties.length === 1 ? 'residence' : 'residences'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>From {formatKES(dest.startingPrice)} / night</span>
                  </div>

                  <h3 className="font-serif text-3xl font-semibold text-[#1A1D1B]">
                    {dest.location}
                  </h3>

                  <p className="text-sm sm:text-base text-[#363935] leading-relaxed">
                    {dest.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1A1D1B]/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-[#5C5F58]">Residences here:</span>
                    {dest.properties.map((p) => (
                      <a
                        key={p.id}
                        href={`/stays/${p.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/stays/${p.slug}`);
                        }}
                        className="font-semibold text-[#1A1D1B] underline underline-offset-4 hover:text-[#2C4C3E]"
                      >
                        {p.name}
                      </a>
                    ))}
                  </div>

                  <a
                    href={`/stays?location=${encodeURIComponent(`${dest.location}, ${dest.city}`)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(
                        `/stays?location=${encodeURIComponent(`${dest.location}, ${dest.city}`)}`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold hover:bg-[#223B30] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore {dest.location}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
