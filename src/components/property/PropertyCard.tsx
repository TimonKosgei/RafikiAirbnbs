import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Property } from '../../types';
import { ResilientImage } from '../ui/ResilientImage';
import { formatKES } from '../../lib/bookings/validation';
import { useRafiki } from '../../context/RafikiContext';

interface PropertyCardProps {
  property: Property;
  checkInParam?: string;
  checkOutParam?: string;
  guestsParam?: number;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  checkInParam,
  checkOutParam,
  guestsParam,
}) => {
  const { navigate } = useRafiki();

  const coverImage =
    property.images.find((img) => img.is_cover)?.url ||
    property.images[0]?.url ||
    '';

  const buildDetailHref = () => {
    const params = new URLSearchParams();
    if (checkInParam) params.set('checkIn', checkInParam);
    if (checkOutParam) params.set('checkOut', checkOutParam);
    if (guestsParam) params.set('guests', String(guestsParam));
    const queryStr = params.toString();
    return `/stays/${property.slug}${queryStr ? `?${queryStr}` : ''}`;
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(buildDetailHref());
  };

  return (
    <article className="group flex flex-col bg-[#FBF9F5] border border-[#1A1D1B]/10 rounded-xl overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
      <a
        href={buildDetailHref()}
        onClick={handleOpen}
        className="block relative aspect-4/3 bg-[#F2EFE9] overflow-hidden"
      >
        <ResilientImage
          src={coverImage}
          alt={`${property.name} in ${property.location}, ${property.city}`}
          fallbackLabel={property.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </a>

      <div className="flex flex-col flex-1 p-6 justify-between space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-[#5C5F58]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-[#2C4C3E]">
                {property.location}, {property.city}
              </span>
              <span aria-hidden="true">·</span>
              <span>{property.property_type}</span>
              {property.is_demo && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="italic text-[#7A776E]">Demo listing</span>
                </>
              )}
            </div>

            {property.rating && (
              <div className="flex items-center gap-1 text-[#1A1D1B] font-medium tabular-nums shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#B89758] text-[#B89758]" />
                <span>{property.rating.toFixed(1)}</span>
                {property.review_count ? (
                  <span className="text-[#5C5F58]">({property.review_count})</span>
                ) : null}
              </div>
            )}
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#1A1D1B] tracking-tight">
            <a
              href={buildDetailHref()}
              onClick={handleOpen}
              className="hover:text-[#2C4C3E] transition-colors"
            >
              {property.name}
            </a>
          </h3>

          <p className="text-sm text-[#4A4E48] tabular-nums">
            <span>
              {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span>
              {property.beds} {property.beds === 1 ? 'bed' : 'beds'}
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span>Up to {property.max_guests} guests</span>
          </p>
        </div>

        <div className="pt-4 border-t border-[#1A1D1B]/8 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#5C5F58] block">From</span>
            <p className="text-base font-semibold text-[#1A1D1B] font-mono-num">
              {formatKES(property.price_per_night)}{' '}
              <span className="font-sans text-xs font-normal text-[#5C5F58]">/ night</span>
            </p>
          </div>

          <a
            href={buildDetailHref()}
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F2EFE9] text-[#1A1D1B] text-xs font-semibold hover:bg-[#2C4C3E] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <span>View stay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
