-- Client Onboarding Migration
-- Extends schema to support 4-step onboarding flow: Sign Up → Property Setup → Assurance Upsell → Dashboard Reveal

-- Extend users table with full_name and company_name
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Onboarding state per client (one row per user)
CREATE TABLE IF NOT EXISTS public.onboarding_states (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  onboarding_step     TEXT NOT NULL DEFAULT 'property_setup'
                        CHECK (onboarding_step IN ('property_setup', 'assurance_upsell')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  tour_complete       BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties owned by clients
CREATE TABLE IF NOT EXISTS public.properties (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient property lookups by user
CREATE INDEX IF NOT EXISTS properties_user_idx ON public.properties(user_id);
