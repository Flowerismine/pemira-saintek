CREATE TABLE IF NOT EXISTS public.app_settings (
  setting_key text PRIMARY KEY,
  setting_value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Insert initial empty token
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('fonnte_api_token', '')
ON CONFLICT (setting_key) DO NOTHING;
