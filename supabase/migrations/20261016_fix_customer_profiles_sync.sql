-- Migration: 20261016_fix_customer_profiles_sync.sql
-- Description: Backfill missing customer profiles for existing auth users and fix signup trigger

BEGIN;

-- 1. Ensure columns exist on customer_profiles
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- 2. Make sure generate_account_number function exists and is safe
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_number := '100644-' || lpad(floor(random() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.customer_profiles WHERE account_number = new_number) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 3. Backfill any user from auth.users missing in customer_profiles
INSERT INTO public.customer_profiles (id, first_name, last_name, email, account_number, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.email, ''),
  public.generate_account_number(),
  'client'
FROM auth.users u
LEFT JOIN public.customer_profiles cp ON cp.id = u.id
WHERE cp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Re-create robust trigger for future user signups
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, first_name, last_name, email, account_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    public.generate_account_number(),
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN public.customer_profiles.first_name = '' THEN EXCLUDED.first_name ELSE public.customer_profiles.first_name END,
    last_name = CASE WHEN public.customer_profiles.last_name = '' THEN EXCLUDED.last_name ELSE public.customer_profiles.last_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer();

COMMIT;