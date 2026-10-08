import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Property, Review, SiteSettings } from '../types';
import { apiFetch } from '../lib/supabase/client';
import { INITIAL_PROPERTIES, INITIAL_REVIEWS, INITIAL_SETTINGS } from '../lib/supabase/seed-data';

export interface ConfirmedDateBlock {
  property_id: string;
  check_in: string;
  check_out: string;
}

interface BootstrapResponse {
  properties: Property[];
  reviews: Review[];
  confirmedDateBlocks: ConfirmedDateBlock[];
  settings: SiteSettings;
}

interface RafikiContextType {
  properties: Property[];
  reviews: Review[];
  confirmedDateBlocks: ConfirmedDateBlock[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
  refreshPublicData: () => Promise<void>;
}

const RafikiContext = createContext<RafikiContextType | undefined>(undefined);

export const RafikiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [confirmedDateBlocks, setConfirmedDateBlocks] = useState<ConfirmedDateBlock[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [locationState, setLocationState] = useState<{
    pathname: string;
    search: string;
  }>(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
  }));

  const refreshPublicData = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<BootstrapResponse>('/api/public/bootstrap');
      setProperties(data.properties);
      setReviews(data.reviews);
      setConfirmedDateBlocks(data.confirmedDateBlocks || []);
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load latest property data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        pathname: window.location.pathname,
        search: window.location.search,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setLocationState({
      pathname: url.pathname,
      search: url.search,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const path = locationState.pathname;
    let pageTitle = 'Rafiki Living | Feel at Home in Kenya';
    let pageDescription = 'Discover beautifully curated short-stay homes in Kenya with Rafiki Living.';

    if (path === '/stays') {
      pageTitle = 'Curated Stays in Nairobi | Rafiki Living';
      pageDescription = 'Browse handpicked short-stay apartments and garden residences in Kilimani, Kileleshwa, and Westlands, Nairobi.';
    } else if (path.startsWith('/stays/')) {
      const slug = path.replace('/stays/', '').split('/')[0];
      const prop = properties.find((p) => p.slug === slug);
      if (prop) {
        pageTitle = `${prop.name} | Rafiki Living`;
        pageDescription = `${prop.name} in ${prop.location}, ${prop.city}. Book directly with Rafiki Living.`;
      }
    } else if (path === '/destinations') {
      pageTitle = 'Destinations in Kenya | Rafiki Living';
    } else if (path === '/about') {
      pageTitle = 'Our Story & Hospitality | Rafiki Living';
    } else if (path === '/contact') {
      pageTitle = 'Contact Us on WhatsApp or Phone | Rafiki Living';
    } else if (path.startsWith('/booking/')) {
      pageTitle = 'Booking Request Status | Rafiki Living';
    } else if (path.startsWith('/admin')) {
      pageTitle = 'Admin Hospitality Console | Rafiki Living';
    }

    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDescription);
  }, [locationState.pathname, properties]);

  return (
    <RafikiContext.Provider
      value={{
        properties,
        reviews,
        confirmedDateBlocks,
        settings,
        loading,
        error,
        pathname: locationState.pathname,
        searchParams: new URLSearchParams(locationState.search),
        navigate,
        refreshPublicData,
      }}
    >
      {children}
    </RafikiContext.Provider>
  );
};

export function useRafiki() {
  const ctx = useContext(RafikiContext);
  if (!ctx) throw new Error('useRafiki must be used within RafikiProvider');
  return ctx;
}
