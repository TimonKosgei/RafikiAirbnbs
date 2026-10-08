import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useRafiki } from '../../context/RafikiContext';

interface SearchBarProps {
  initialLocation?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  onSearch?: (filters: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
  variant?: 'hero' | 'inline';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialLocation = 'all',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  onSearch,
  variant = 'hero',
}) => {
  const { properties, navigate } = useRafiki();
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  const activeLocations = Array.from(
    new Set(properties.map((p) => `${p.location}, ${p.city}`))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ location, checkIn, checkOut, guests });
      return;
    }

    const params = new URLSearchParams();
    if (location && location !== 'all') params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', String(guests));

    navigate(`/stays?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 p-3 sm:p-4 ${
        variant === 'hero' ? 'shadow-lg' : ''
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-3 flex flex-col">
          <label
            htmlFor="search-where"
            className="text-xs font-medium text-[#5C5F58] mb-1.5"
          >
            Where
          </label>
          <select
            id="search-where"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-[#F2EFE9] text-sm font-medium text-[#1A1D1B] border border-transparent focus:border-[#2C4C3E] focus:bg-white focus:outline-none transition-colors"
          >
            <option value="all">Nairobi, Kenya (All Stays)</option>
            {activeLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <label
            htmlFor="search-checkin"
            className="text-xs font-medium text-[#5C5F58] mb-1.5"
          >
            Check-in
          </label>
          <input
            id="search-checkin"
            type="date"
            value={checkIn}
            min="2026-10-08"
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) {
                setCheckOut('');
              }
            }}
            className="w-full h-11 px-3 rounded-lg bg-[#F2EFE9] text-sm font-medium text-[#1A1D1B] font-mono-num border border-transparent focus:border-[#2C4C3E] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <label
            htmlFor="search-checkout"
            className="text-xs font-medium text-[#5C5F58] mb-1.5"
          >
            Check-out
          </label>
          <input
            id="search-checkout"
            type="date"
            value={checkOut}
            min={checkIn || '2026-10-09'}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-[#F2EFE9] text-sm font-medium text-[#1A1D1B] font-mono-num border border-transparent focus:border-[#2C4C3E] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="lg:col-span-1 flex flex-col">
          <label
            htmlFor="search-guests"
            className="text-xs font-medium text-[#5C5F58] mb-1.5"
          >
            Guests
          </label>
          <select
            id="search-guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full h-11 px-2.5 rounded-lg bg-[#F2EFE9] text-sm font-medium text-[#1A1D1B] tabular-nums border border-transparent focus:border-[#2C4C3E] focus:bg-white focus:outline-none transition-colors"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            className="w-full h-11 px-5 rounded-lg bg-[#2C4C3E] hover:bg-[#223B30] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Search stays</span>
          </button>
        </div>
      </div>
    </form>
  );
};
