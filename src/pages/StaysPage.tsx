import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRafiki } from '../context/RafikiContext';
import { SearchBar } from '../components/booking/SearchBar';
import { PropertyCard } from '../components/property/PropertyCard';
import { WhatsAppButton } from '../components/ui/ContactButtons';
import { datesOverlap } from '../lib/bookings/validation';
import { WhatsAppMessages } from '../lib/whatsapp';

export const StaysPage: React.FC = () => {
  const { properties, confirmedDateBlocks, searchParams, navigate } = useRafiki();

  const initialLocation = searchParams.get('location') || 'all';
  const initialCheckIn = searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('checkOut') || '';
  const initialGuests = Number(searchParams.get('guests')) || 1;

  const [locationFilter, setLocationFilter] = useState<string>(initialLocation);
  const [checkInFilter, setCheckInFilter] = useState<string>(initialCheckIn);
  const [checkOutFilter, setCheckOutFilter] = useState<string>(initialCheckOut);
  const [guestsFilter, setGuestsFilter] = useState<number>(initialGuests);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const propertyTypes = useMemo(() => {
    const types = Array.from(new Set(properties.map((p) => p.property_type)));
    return ['all', ...types];
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (locationFilter && locationFilter !== 'all') {
        const fullLoc = `${prop.location}, ${prop.city}`.toLowerCase();
        const q = locationFilter.toLowerCase();
        if (
          !fullLoc.includes(q) &&
          !prop.location.toLowerCase().includes(q) &&
          !prop.city.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (guestsFilter > 1 && prop.max_guests < guestsFilter) {
        return false;
      }

      if (typeFilter !== 'all' && prop.property_type !== typeFilter) {
        return false;
      }

      if (checkInFilter && checkOutFilter && checkOutFilter > checkInFilter) {
        const hasConflict = confirmedDateBlocks.some(
          (block) =>
            block.property_id === prop.id &&
            datesOverlap(checkInFilter, checkOutFilter, block.check_in, block.check_out)
        );
        if (hasConflict) {
          return false;
        }
      }

      return true;
    });
  }, [
    properties,
    locationFilter,
    guestsFilter,
    typeFilter,
    checkInFilter,
    checkOutFilter,
    confirmedDateBlocks,
  ]);

  const handleSearchUpdate = (filters: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    setLocationFilter(filters.location);
    setCheckInFilter(filters.checkIn);
    setCheckOutFilter(filters.checkOut);
    setGuestsFilter(filters.guests);

    const params = new URLSearchParams();
    if (filters.location && filters.location !== 'all')
      params.set('location', filters.location);
    if (filters.checkIn) params.set('checkIn', filters.checkIn);
    if (filters.checkOut) params.set('checkOut', filters.checkOut);
    if (filters.guests) params.set('guests', String(filters.guests));
    navigate(`/stays${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleResetFilters = () => {
    setLocationFilter('all');
    setCheckInFilter('');
    setCheckOutFilter('');
    setGuestsFilter(1);
    setTypeFilter('all');
    navigate('/stays');
  };

  const hasActiveFilters =
    locationFilter !== 'all' ||
    Boolean(checkInFilter) ||
    Boolean(checkOutFilter) ||
    guestsFilter > 1 ||
    typeFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <p className="text-xs font-medium text-[#2C4C3E]">
          Rafiki Airbnbs Collection · Nairobi, Kenya
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1A1D1B] tracking-tight">
          Our Curated Stays
        </h1>
        <p className="text-base text-[#4A4E48] leading-relaxed">
          Each residence is personally inspected, equipped with high-speed fiber Wi-Fi and backup
          power, and supported by our Nairobi concierge team via WhatsApp.
        </p>
      </div>

      <SearchBar
        variant="inline"
        initialLocation={locationFilter}
        initialCheckIn={checkInFilter}
        initialCheckOut={checkOutFilter}
        initialGuests={guestsFilter}
        onSearch={handleSearchUpdate}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A1D1B]/10 pb-5">
        <div className="flex items-center gap-1.5 p-1 bg-[#F2EFE9] rounded-lg overflow-x-auto">
          {propertyTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === type
                  ? 'bg-[#FBF9F5] text-[#1A1D1B] shadow-2xs font-semibold'
                  : 'text-[#5C5F58] hover:text-[#1A1D1B]'
              }`}
            >
              {type === 'all' ? 'All Residences' : type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-[#5C5F58] tabular-nums">
          <span>
            Showing <strong className="text-[#1A1D1B]">{filteredProperties.length}</strong> of{' '}
            {properties.length} {properties.length === 1 ? 'stay' : 'stays'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[#2C4C3E] font-semibold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              checkInParam={checkInFilter}
              checkOutParam={checkOutFilter}
              guestsParam={guestsFilter}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 p-10 text-center max-w-xl mx-auto space-y-5">
          <h2 className="font-serif text-2xl font-semibold text-[#1A1D1B]">
            No residences match your exact filter criteria
          </h2>
          <p className="text-sm text-[#4A4E48] leading-relaxed">
            Try clearing your date or guest filters, or message us directly on WhatsApp—our
            hospitality team can check flexible check-in dates across our Nairobi homes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-lg bg-[#1A1D1B] text-white text-sm font-medium hover:bg-[#2E3330] transition-colors cursor-pointer"
            >
              Show all {properties.length} stays
            </button>
            <WhatsAppButton
              label="Ask our team on WhatsApp"
              variant="primary"
              message={WhatsAppMessages.generalInquiry()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
