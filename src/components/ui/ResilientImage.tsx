import React, { useState } from 'react';
import { Home } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-[#2C4C3E] via-[#243E33] to-[#1A2C24] text-white p-6 text-center select-none overflow-hidden ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#B89758_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2.5 backdrop-blur-xs border border-white/20">
            <Home className="w-6 h-6 text-[#B89758] stroke-[1.5]" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-wide text-white">
            {fallbackLabel || alt || 'Rafiki Living Residence'}
          </span>
          <span className="text-xs text-[#D6D3CD] mt-0.5 tracking-wider uppercase font-medium">
            Nairobi · Kenya
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
