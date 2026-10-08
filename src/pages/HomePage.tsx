import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { ResilientImage } from '../components/ui/ResilientImage';
import { WhatsAppButton } from '../components/ui/ContactButtons';
import { SearchBar } from '../components/booking/SearchBar';
import { PropertyCard } from '../components/property/PropertyCard';
import { KENYA_DESTINATIONS_META } from '../lib/supabase/seed-data';
import { formatKES } from '../lib/bookings/validation';
import { WhatsAppMessages } from '../lib/whatsapp';

export const HomePage: React.FC = () => {
  const { properties, reviews, navigate } = useRafiki();

  const featuredProperties = properties.filter((p) => p.featured).slice(0, 3);
  const displayProperties =
    featuredProperties.length > 0 ? featuredProperties : properties.slice(0, 3);

  const activeDestinations = Array.from(
    new Set(properties.map((p) => p.location))
  ).map((loc) => {
    const matchingProps = properties.filter((p) => p.location === loc);
    const meta = KENYA_DESTINATIONS_META[loc] || {
      city: matchingProps[0]?.city || 'Nairobi',
      description: `Handpicked short-stay residences in ${loc}, ${matchingProps[0]?.city || 'Kenya'}.`,
      highlights: ['24/7 security', 'Personal concierge'],
      defaultImage: '',
    };
    const minPrice = Math.min(...matchingProps.map((p) => p.price_per_night));

    return {
      location: loc,
      city: meta.city,
      description: meta.description,
      propertyCount: matchingProps.length,
      minPrice,
      image: matchingProps[0]?.images.find((i) => i.is_cover)?.url || meta.defaultImage,
    };
  });

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <div className="relative rounded-2xl overflow-hidden min-h-[540px] sm:min-h-[600px] flex flex-col justify-end p-6 sm:p-12 lg:p-16">
            <div className="absolute inset-0">
              <ResilientImage
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=85"
                alt="Sunlit luxury living room at Rafiki Heights in Kilimani, Nairobi"
                fallbackLabel="Rafiki Airbnbs · Kenya"
                priority
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
            </div>

            <div className="relative z-10 max-w-2xl space-y-6 pb-6 sm:pb-10">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-[#E6DFD3]">
                Nairobi, Kenya · Boutique Short-Stay Hospitality
              </p>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[64px] font-semibold text-white leading-[1.08] tracking-tight">
                Where Every Stay Feels Like Home.
              </h1>

              <p className="text-base sm:text-lg text-[#EAE6DF] leading-relaxed max-w-xl">
                Beautifully curated stays. The best hospitality. Unforgettable experiences.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="/stays"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/stays');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#2C4C3E] hover:bg-[#223B30] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore our stays</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <WhatsAppButton
                  label="Chat with us on WhatsApp"
                  variant="subtle"
                  size="lg"
                  message={WhatsAppMessages.generalInquiry()}
                />
              </div>
            </div>

            <div className="relative z-10">
              <SearchBar variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED PROPERTIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#2C4C3E]">
              Our Launch Collection · {displayProperties.length} Residences
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1D1B] tracking-tight">
              Stay somewhere special
            </h2>
            <p className="text-base text-[#5C5F58]">
              A small collection of carefully selected homes.
            </p>
          </div>

          <a
            href="/stays"
            onClick={(e) => {
              e.preventDefault();
              navigate('/stays');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2C4C3E] hover:text-[#1A1D1B] transition-colors whitespace-nowrap shrink-0"
          >
            <span>View all {properties.length} stays</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* 3. ACTIVE DESTINATIONS */}
      <section className="bg-[#F2EFE9] border-y border-[#1A1D1B]/8 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-medium text-[#2C4C3E]">
                Curated Neighborhoods
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1D1B] tracking-tight">
                Nairobi’s most welcoming neighborhoods
              </h2>
              <p className="text-base text-[#5C5F58]">
                Every home in the Rafiki Airbnbs collection is chosen for walkable greenery, 24-hour security, and
                proximity to Nairobi’s dining, diplomatic, and safari links.
              </p>
            </div>

            <a
              href="/destinations"
              onClick={(e) => {
                e.preventDefault();
                navigate('/destinations');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2C4C3E] hover:text-[#1A1D1B] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Explore destinations</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeDestinations.map((dest) => (
              <a
                key={dest.location}
                href={`/stays?location=${encodeURIComponent(`${dest.location}, ${dest.city}`)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(
                    `/stays?location=${encodeURIComponent(`${dest.location}, ${dest.city}`)}`
                  );
                }}
                className="group flex flex-col bg-[#FBF9F5] border border-[#1A1D1B]/10 rounded-xl overflow-hidden transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div className="aspect-16/9 overflow-hidden bg-[#E5DFD3]">
                  <ResilientImage
                    src={dest.image}
                    alt={`${dest.location}, ${dest.city}`}
                    fallbackLabel={dest.location}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5C5F58] tabular-nums">
                      <span>{dest.city}, Kenya</span>
                      <span>
                        {dest.propertyCount}{' '}
                        {dest.propertyCount === 1 ? 'residence' : 'residences'} · From{' '}
                        {formatKES(dest.minPrice)}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#1A1D1B] group-hover:text-[#2C4C3E] transition-colors">
                      {dest.location}
                    </h3>
                    <p className="text-sm text-[#4A4E48] leading-relaxed">
                      {dest.description}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2C4C3E]">
                    <span>Browse {dest.location} stays</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOSPITALITY STANDARD & ATTRIBUTABLE REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#2C4C3E]">
                Why Guests Choose Rafiki Airbnbs
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1D1B] tracking-tight">
                Personal Kenyan hospitality, not an anonymous lockbox.
              </h2>
              <p className="text-base text-[#4A4E48] leading-relaxed">
                &ldquo;Rafiki&rdquo; means friend in Swahili. Whether you are arriving from Europe or
                North America for a Kenyan safari, relocating to Nairobi, or visiting on diplomatic
                business, our team looks after every detail personally.
              </p>
            </div>

            <div className="space-y-6 border-t border-[#1A1D1B]/10 pt-6">
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-semibold text-[#1A1D1B]">
                  01. Direct WhatsApp &amp; Phone Confirmation
                </h3>
                <p className="text-sm text-[#4A4E48] leading-relaxed">
                  Submit a stay request in under a minute. Our Nairobi concierge reaches out
                  personally via WhatsApp or phone to verify dates, coordinate airport pickup, and
                  confirm your reservation without hidden platform fees.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-[#1A1D1B]/8 pt-5">
                <h3 className="font-serif text-xl font-semibold text-[#1A1D1B]">
                  02. Business-Grade Fiber &amp; Backup Power
                </h3>
                <p className="text-sm text-[#4A4E48] leading-relaxed">
                  Every residence features dedicated high-speed fiber Wi-Fi, ergonomic timber
                  workspaces, and full automatic generator backup for uninterrupted calls.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-[#1A1D1B]/8 pt-5">
                <h3 className="font-serif text-xl font-semibold text-[#1A1D1B]">
                  03. 24/7 Manned Security &amp; Curated Comfort
                </h3>
                <p className="text-sm text-[#4A4E48] leading-relaxed">
                  Set inside vetted compounds in Kilimani, Kileleshwa, and Westlands with 24-hour
                  guards, organic cotton bedding, and complimentary Kenyan AA coffee.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1A1D1B]/10 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#1A1D1B]">
                  Guest Experiences
                </h3>
                <p className="text-xs text-[#5C5F58]">
                  Verified reflections from international travelers and expats
                </p>
              </div>
              <div className="text-right tabular-nums">
                <span className="font-serif text-2xl font-semibold text-[#1A1D1B]">4.9 / 5.0</span>
                <span className="block text-xs text-[#5C5F58]">
                  Across {reviews.length} verified stays
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {reviews.slice(0, 3).map((rev) => (
                <blockquote
                  key={rev.id}
                  className="p-6 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/8 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5C5F58]">
                    <span className="font-semibold text-[#2C4C3E]">
                      Stayed at {rev.property_name || 'Rafiki Residence'} · {rev.stay_date}
                    </span>
                    <div className="flex items-center gap-0.5 text-[#B89758]">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5 fill-[#B89758] text-[#B89758]"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-[#1A1D1B] leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  <footer className="text-xs text-[#4A4E48]">
                    <strong className="font-semibold text-[#1A1D1B]">{rev.guest_name}</strong>
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span>{rev.guest_origin}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
