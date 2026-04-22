CREATE TABLE IF NOT EXISTS public.app_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  theme_id   UUID NOT NULL DEFAULT 'fd3e8a11-0000-0000-0000-000000000001'
               CHECK (theme_id = 'fd3e8a11-0000-0000-0000-000000000001'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, theme_id)
VALUES ('global', 'fd3e8a11-0000-0000-0000-000000000001')
ON CONFLICT (key) DO NOTHING;
