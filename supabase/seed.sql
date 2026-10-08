INSERT INTO public.properties (
  id, name, slug, description, neighborhood_overview, location, city, country,
  price_per_night, max_guests, bedrooms, beds, bathrooms, property_type, amenities,
  house_rules, check_in_time, check_out_time, featured, published, is_demo
) VALUES
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'),
    'Rafiki Heights',
    'rafiki-heights',
    'A sun-drenched two-bedroom residence in Kilimani, with East African teak furnishings, floor-to-ceiling windows, and a chef-ready kitchen.',
    'A short walk from Yaya Centre, cafes, and organic grocers, with convenient access to Nairobi National Park and JKIA.',
    'Kilimani', 'Nairobi', 'Kenya', 8500, 4, 2, 2, 2, 'Boutique Apartment',
    '["High-Speed Fiber Wi-Fi","Dedicated Workspace","Heated Swimming Pool","Free Secure Parking","Fully Equipped Kitchen","Smart 4K TV","Washing Machine & Dryer","24/7 Manned Security & CCTV","Full Backup Power Generator","Private Balcony / Veranda","Kenyan AA Coffee & Tea Bar"]'::jsonb,
    '{"smoking":"No smoking inside the apartment or on the balcony","pets":"Pets are not permitted","parties":"No parties, events, or unregistered overnight guests","quiet_hours":"Quiet hours observed between 10:00 PM and 7:00 AM"}'::jsonb,
    '2:00 PM', '11:00 AM', true, true, true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'),
    'Rafiki Haven',
    'rafiki-haven',
    'A tranquil garden residence in Kileleshwa with three generous bedrooms, a wrap-around veranda, and indoor-outdoor living.',
    'Near the Nairobi Arboretum walking trails, with a peaceful residential setting and quick access to Lavington and Westlands.',
    'Kileleshwa', 'Nairobi', 'Kenya', 13500, 6, 3, 4, 3, 'Garden Residence',
    '["High-Speed Fiber Wi-Fi","Free Secure Parking","Fully Equipped Kitchen","Smart 4K TV","Washing Machine & Dryer","24/7 Manned Security & CCTV","Full Backup Power Generator","Private Balcony / Veranda","Kenyan AA Coffee & Tea Bar","Dedicated Workspace"]'::jsonb,
    '{"smoking":"Smoking permitted only in designated outdoor garden area","pets":"Pets are not permitted","parties":"No commercial photography or large gatherings without prior written approval","quiet_hours":"Quiet hours observed between 10:00 PM and 7:00 AM"}'::jsonb,
    '2:00 PM', '11:00 AM', true, true, true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'),
    'Rafiki Urban',
    'rafiki-urban',
    'An executive one-bedroom suite in Westlands with a solid oak workstation, dual-ISP fiber internet, generator backup, and rooftop plunge pool access.',
    'In Westlands near UN Avenue links, Sarit Centre, restaurants, galleries, and executive offices.',
    'Westlands', 'Nairobi', 'Kenya', 7500, 2, 1, 1, 1.5, 'Executive Suite',
    '["High-Speed Fiber Wi-Fi","Dedicated Workspace","Heated Swimming Pool","Free Secure Parking","Fully Equipped Kitchen","Smart 4K TV","Air Conditioning","Washing Machine & Dryer","24/7 Manned Security & CCTV","Full Backup Power Generator","Kenyan AA Coffee & Tea Bar"]'::jsonb,
    '{"smoking":"No smoking inside the residence","pets":"Pets are not permitted","parties":"No parties or events allowed","quiet_hours":"Quiet hours observed between 10:00 PM and 7:00 AM"}'::jsonb,
    '2:00 PM', '11:00 AM', true, true, true
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.property_images (id, property_id, url, alt, is_cover, display_order)
VALUES
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-image-1'), uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'), 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80', 'Rafiki Heights sunlit living room overlooking Kilimani trees', true, 0),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-image-2'), uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'), 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80', 'Rafiki Heights serene master bedroom', false, 1),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-image-3'), uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'), 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 'Rafiki Heights rooftop terrace and plunge pool', false, 2),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-image-4'), uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'), 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80', 'Rafiki Heights modern kitchen', false, 3),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-image-1'), uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'), 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', 'Rafiki Haven garden veranda', true, 0),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-image-2'), uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'), 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80', 'Rafiki Haven dining and living lounge', false, 1),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-image-3'), uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'), 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=1200&q=80', 'Rafiki Haven master bedroom', false, 2),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-image-4'), uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'), 'https://images.unsplash.com/photo-1512917774080-9991c4c750?auto=format&fit=crop&w=1200&q=80', 'Rafiki Haven private courtyard', false, 3),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-urban-image-1'), uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'), 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', 'Rafiki Urban executive living space', true, 0),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-urban-image-2'), uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'), 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80', 'Rafiki Urban bedroom', false, 1),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-urban-image-3'), uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'), 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 'Rafiki Urban rooftop pool', false, 2),
  (uuid_generate_v5(uuid_ns_url(), 'rafiki-urban-image-4'), uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'), 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80', 'Rafiki Urban modern kitchen', false, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (
  id, property_id, guest_name, guest_origin, rating, comment, stay_date, published
) VALUES
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-review-1'),
    uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'),
    'Elena Rostova', 'Zurich, Switzerland · 6-night stay', 5,
    'Rafiki Heights felt like a private sanctuary in Kilimani. The team coordinated our airport pickup and the fiber internet never dropped during our remote work week.',
    'September 2026', true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-heights-review-2'),
    uuid_generate_v5(uuid_ns_url(), 'rafiki-heights'),
    'David & Sarah Miller', 'London, United Kingdom · 4-night stay', 5,
    'Impeccably clean with warm lighting, comfortable beds, and 24-hour security that made us feel at ease in Nairobi.',
    'September 2026', true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-review-1'),
    uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'),
    'Dr. Henrik Lindholm', 'Stockholm, Sweden · 10-night stay', 5,
    'Three proper bedrooms and a quiet garden veranda in Kileleshwa gave our family a true home base while relocating to Nairobi.',
    'August 2026', true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-haven-review-2'),
    uuid_generate_v5(uuid_ns_url(), 'rafiki-haven'),
    'Amara Okafor', 'Lagos & London · 5-night stay', 5,
    'Thoughtful hospitality from start to finish. MIS Stays checked in via WhatsApp and arranged a late check-out before our evening flight.',
    'September 2026', true
  ),
  (
    uuid_generate_v5(uuid_ns_url(), 'rafiki-urban-review-1'),
    uuid_generate_v5(uuid_ns_url(), 'rafiki-urban'),
    'Thomas Beaumont', 'Paris, France · 5-night stay', 5,
    'The solid oak desk, backup generator, and quiet bedroom allowed me to work seamlessly, with Nairobi restaurants close by.',
    'September 2026', true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
  ('whatsapp_number', '254712345678'),
  ('phone_number', '+254 712 345 678'),
  ('support_email', 'karibu@rafikiliving.com'),
  ('office_address', 'Argwings Kodhek Road, Kilimani, Nairobi, Kenya'),
  ('company_tagline', 'Where Every Stay Feels Like Home.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
