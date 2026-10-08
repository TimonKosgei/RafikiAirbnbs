export type BookingStatus = 'pending' | 'contacted' | 'confirmed' | 'cancelled' | 'completed';

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt: string;
  is_cover: boolean;
  display_order: number;
}

export interface HouseRules {
  smoking: string;
  pets: string;
  parties: string;
  quiet_hours?: string;
  other?: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  description: string;
  neighborhood_overview: string;
  location: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  property_type: string;
  amenities: string[];
  house_rules: HouseRules;
  check_in_time: string;
  check_out_time: string;
  featured: boolean;
  published: boolean;
  is_demo: boolean;
  images: PropertyImage[];
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface BookingRequest {
  id: string;
  reference_number: string;
  property_id: string;
  property_name: string;
  property_slug: string;
  property_location: string;
  guest_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_nights: number;
  estimated_total: number;
  special_requests: string;
  status: BookingStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  property_name?: string;
  guest_name: string;
  guest_origin: string;
  rating: number;
  comment: string;
  stay_date: string;
  published: boolean;
  created_at: string;
}

export interface SiteSettings {
  whatsapp_number: string;
  phone_number: string;
  support_email: string;
  office_address: string;
  company_tagline: string;
  supabase_configured?: boolean;
}
