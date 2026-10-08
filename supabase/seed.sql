INSERT INTO public.settings (key, value) VALUES
  ('whatsapp_number', '254712345678'),
  ('phone_number', '+254 712 345 678'),
  ('support_email', 'karibu@rafikiliving.com'),
  ('office_address', 'Argwings Kodhek Road, Kilimani, Nairobi, Kenya'),
  ('company_tagline', 'Feel at home in Kenya.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
