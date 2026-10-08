ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS guests_email_lower_unique
  ON public.guests (lower(email));
CREATE INDEX IF NOT EXISTS booking_requests_guest_created_idx
  ON public.booking_requests (guest_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_confirmed_bookings'
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT no_overlapping_confirmed_bookings
      EXCLUDE USING gist (
        property_id WITH =,
        daterange(check_in, check_out, '[)') WITH &&
      )
      WHERE (status = 'confirmed');
  END IF;
END;
$$;

DROP POLICY IF EXISTS profiles_read_self_or_staff ON public.profiles;
CREATE POLICY profiles_read_self_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS properties_public_read ON public.properties;
CREATE POLICY properties_public_read ON public.properties
  FOR SELECT TO anon, authenticated
  USING (published OR public.is_staff());
DROP POLICY IF EXISTS properties_staff_insert ON public.properties;
CREATE POLICY properties_staff_insert ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS properties_staff_update ON public.properties;
CREATE POLICY properties_staff_update ON public.properties
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS properties_staff_delete ON public.properties;
CREATE POLICY properties_staff_delete ON public.properties
  FOR DELETE TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS property_images_public_read ON public.property_images;
CREATE POLICY property_images_public_read ON public.property_images
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
        AND properties.published
    )
  );
DROP POLICY IF EXISTS property_images_staff_write ON public.property_images;
CREATE POLICY property_images_staff_write ON public.property_images
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS guests_staff_access ON public.guests;
CREATE POLICY guests_staff_access ON public.guests
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS bookings_staff_access ON public.booking_requests;
CREATE POLICY bookings_staff_access ON public.booking_requests
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (
    (published AND EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = reviews.property_id
        AND properties.published
    ))
    OR public.is_staff()
  );
DROP POLICY IF EXISTS reviews_staff_write ON public.reviews;
CREATE POLICY reviews_staff_write ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS settings_public_read ON public.settings;
CREATE POLICY settings_public_read ON public.settings
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS settings_staff_write ON public.settings;
CREATE POLICY settings_staff_write ON public.settings
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.create_booking_request(p_data JSONB)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  selected_property public.properties%ROWTYPE;
  selected_guest_id UUID;
  created_booking public.booking_requests%ROWTYPE;
  nights INTEGER;
BEGIN
  IF COALESCE(trim(p_data->>'full_name'), '') = ''
    OR COALESCE(trim(p_data->>'email'), '') = ''
    OR COALESCE(trim(p_data->>'phone'), '') = '' THEN
    RAISE EXCEPTION 'Please fill in your full name, email address, and WhatsApp/phone number.';
  END IF;

  SELECT * INTO selected_property
  FROM public.properties
  WHERE id = (p_data->>'property_id')::UUID AND published;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected property is not available.';
  END IF;

  IF (p_data->>'check_in')::DATE < CURRENT_DATE
    OR (p_data->>'check_out')::DATE <= (p_data->>'check_in')::DATE THEN
    RAISE EXCEPTION 'Please select valid future check-in and check-out dates.';
  END IF;

  nights := (p_data->>'check_out')::DATE - (p_data->>'check_in')::DATE;
  IF COALESCE((p_data->>'guests_count')::INTEGER, 1) < 1
    OR COALESCE((p_data->>'guests_count')::INTEGER, 1) > selected_property.max_guests THEN
    RAISE EXCEPTION '% accommodates a maximum of % guests.',
      selected_property.name, selected_property.max_guests;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking_requests
    WHERE property_id = selected_property.id
      AND status = 'confirmed'
      AND daterange(check_in, check_out, '[)')
          && daterange((p_data->>'check_in')::DATE, (p_data->>'check_out')::DATE, '[)')
  ) THEN
    RAISE EXCEPTION '% is already confirmed for some or all of these dates. Please choose alternative dates.',
      selected_property.name;
  END IF;

  INSERT INTO public.guests (full_name, email, phone)
  VALUES (
    trim(p_data->>'full_name'),
    lower(trim(p_data->>'email')),
    trim(p_data->>'phone')
  )
  ON CONFLICT ((lower(email))) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone
  RETURNING id INTO selected_guest_id;

  INSERT INTO public.booking_requests (
    reference_number,
    property_id,
    guest_id,
    check_in,
    check_out,
    guests_count,
    total_nights,
    estimated_total,
    special_requests,
    status
  )
  VALUES (
    'RFL-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
      upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16)),
    selected_property.id,
    selected_guest_id,
    (p_data->>'check_in')::DATE,
    (p_data->>'check_out')::DATE,
    COALESCE((p_data->>'guests_count')::INTEGER, 1),
    nights,
    nights * selected_property.price_per_night,
    COALESCE(p_data->>'special_requests', ''),
    'pending'
  )
  RETURNING * INTO created_booking;

  RETURN jsonb_build_object(
    'booking', jsonb_build_object(
      'id', created_booking.id,
      'reference_number', created_booking.reference_number,
      'property_id', selected_property.id,
      'property_name', selected_property.name,
      'property_slug', selected_property.slug,
      'property_location', selected_property.location || ', ' || selected_property.city,
      'guest_id', selected_guest_id,
      'guest_name', trim(p_data->>'full_name'),
      'guest_email', lower(trim(p_data->>'email')),
      'guest_phone', trim(p_data->>'phone'),
      'check_in', created_booking.check_in,
      'check_out', created_booking.check_out,
      'guests_count', created_booking.guests_count,
      'total_nights', created_booking.total_nights,
      'estimated_total', created_booking.estimated_total,
      'special_requests', created_booking.special_requests,
      'status', created_booking.status,
      'created_at', created_booking.created_at,
      'updated_at', created_booking.updated_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_booking_request(p_reference TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  booking_row public.booking_requests%ROWTYPE;
  guest_row public.guests%ROWTYPE;
  property_row public.properties%ROWTYPE;
  cover_image TEXT;
BEGIN
  SELECT * INTO booking_row
  FROM public.booking_requests
  WHERE upper(reference_number) = upper(trim(p_reference));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking reference not found. Please check your reference code.';
  END IF;

  SELECT * INTO guest_row FROM public.guests WHERE id = booking_row.guest_id;
  SELECT * INTO property_row FROM public.properties WHERE id = booking_row.property_id;
  SELECT url INTO cover_image
  FROM public.property_images
  WHERE property_id = property_row.id
  ORDER BY is_cover DESC, display_order ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'booking', jsonb_build_object(
      'id', booking_row.id,
      'reference_number', booking_row.reference_number,
      'property_id', booking_row.property_id,
      'property_name', property_row.name,
      'property_slug', property_row.slug,
      'property_location', property_row.location || ', ' || property_row.city,
      'guest_name', guest_row.full_name,
      'check_in', booking_row.check_in,
      'check_out', booking_row.check_out,
      'guests_count', booking_row.guests_count,
      'total_nights', booking_row.total_nights,
      'estimated_total', booking_row.estimated_total,
      'special_requests', booking_row.special_requests,
      'status', booking_row.status,
      'created_at', booking_row.created_at,
      'updated_at', booking_row.updated_at
    ),
    'property', jsonb_build_object(
      'id', property_row.id,
      'name', property_row.name,
      'slug', property_row.slug,
      'location', property_row.location,
      'city', property_row.city,
      'check_in_time', property_row.check_in_time,
      'check_out_time', property_row.check_out_time,
      'cover_image', COALESCE(cover_image, '')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.public_confirmed_date_blocks(p_property_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'property_id', booking_requests.property_id,
      'check_in', booking_requests.check_in,
      'check_out', booking_requests.check_out
    )),
    '[]'::jsonb
  )
  FROM public.booking_requests
  JOIN public.properties ON properties.id = booking_requests.property_id
  WHERE booking_requests.status = 'confirmed'
    AND properties.published
    AND (p_property_id IS NULL OR booking_requests.property_id = p_property_id);
$$;

REVOKE ALL ON FUNCTION public.create_booking_request(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_booking_request(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_confirmed_date_blocks(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_request(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_booking_request(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_confirmed_date_blocks(UUID) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS property_images_public_storage_read ON storage.objects;
CREATE POLICY property_images_public_storage_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');
DROP POLICY IF EXISTS property_images_staff_storage_write ON storage.objects;
CREATE POLICY property_images_staff_storage_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'property-images' AND public.is_staff())
  WITH CHECK (bucket_id = 'property-images' AND public.is_staff());
