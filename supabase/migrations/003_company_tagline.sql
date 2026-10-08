UPDATE public.settings
SET value = 'Where Every Stay Feels Like Home.',
    updated_at = NOW()
WHERE key = 'company_tagline';
