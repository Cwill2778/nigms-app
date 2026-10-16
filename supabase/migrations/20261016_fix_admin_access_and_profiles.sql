-- ==============================================================================
-- Migration: 20261016_fix_admin_access_and_profiles.sql
-- Description: Fix Admin Panel RBAC, auto-populate admin_profiles, and restore
--              full access to Chats, Quotes (name_your_price), and Contact Forms.
-- Target: naileditpropertysolutions.com (Supabase)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ENSURE admin_profiles TABLE EXISTS & HAS COMPLETE SCHEMA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  email TEXT,
  role TEXT DEFAULT 'admin',
  employee_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was partially created
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure customer_profiles has role column
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- ------------------------------------------------------------------------------
-- 2. AUTO-POPULATE / SYNC ADMIN USERS INTO admin_profiles
-- ------------------------------------------------------------------------------
-- Seed / promote Charles and any authorized admin account from auth.users
INSERT INTO public.admin_profiles (user_id, email, first_name, last_name, role, employee_id)
SELECT 
  u.id AS user_id,
  u.email,
  COALESCE(NULLIF(u.raw_user_meta_data->>'first_name', ''), 'Charles') AS first_name,
  COALESCE(NULLIF(u.raw_user_meta_data->>'last_name', ''), 'Willis') AS last_name,
  'admin' AS role,
  'EMP-' || UPPER(SUBSTRING(REPLACE(u.id::text, '-', ''), 1, 6)) AS employee_id
FROM auth.users u
WHERE 
  u.email ILIKE '%@naileditpropertysolutions.com'
  OR u.email ILIKE 'charles%'
  OR u.email ILIKE 'support.nailedit%'
  OR u.email ILIKE 'cwill2778%'
  OR u.raw_user_meta_data->>'role' IN ('admin', 'staff')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin';

-- Also update customer_profiles for these admin users
UPDATE public.customer_profiles
SET role = 'admin'
WHERE id IN (SELECT user_id FROM public.admin_profiles);

-- ------------------------------------------------------------------------------
-- 3. BULLETPROOF ROLE & PERMISSION HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
-- Returns the verified role of the current authenticated user.
-- Looks up admin_profiles first, then customer_profiles, then email pattern.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    -- 1. Explicit admin in admin_profiles
    (SELECT role::text FROM public.admin_profiles WHERE user_id = auth.uid() LIMIT 1),
    -- 2. Explicit admin/staff in customer_profiles
    (SELECT role::text FROM public.customer_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'technician') LIMIT 1),
    -- 3. Explicit role in raw auth metadata
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'staff', 'technician') LIMIT 1),
    -- 4. Known business email addresses or domains
    (SELECT 'admin' FROM auth.users WHERE id = auth.uid() AND (
      email ILIKE '%@naileditpropertysolutions.com'
      OR email ILIKE 'charles%'
      OR email ILIKE 'support.nailedit%'
      OR email ILIKE 'cwill2778%'
    ) LIMIT 1),
    -- 5. Standard client profile fallback
    (SELECT COALESCE(role::text, 'client') FROM public.customer_profiles WHERE id = auth.uid() LIMIT 1),
    'anon'
  );
$$;

-- Helper to check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.get_my_role() = 'admin';
$$;

-- Helper to check if current user is Staff (Admin or Field Technician)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.get_my_role() IN ('admin', 'staff', 'technician');
$$;

-- ------------------------------------------------------------------------------
-- 4. GRANT BASE POSTGRESQL PRIVILEGES TO AUTHENTICATED
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.admin_profiles,
  public.customer_profiles,
  public.contact_submissions,
  public.name_your_price,
  public.chat_conversations,
  public.chat_messages,
  public.page_visits,
  public.career_applications,
  public.customers,
  public.properties,
  public.work_orders,
  public.assets,
  public.reviews,
  public.faqs,
  public.site_settings
TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE
  public.chat_conversations,
  public.chat_messages
TO anon;

GRANT INSERT ON TABLE
  public.contact_submissions,
  public.name_your_price,
  public.page_visits,
  public.career_applications
TO anon;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY POLICIES FOR ADMIN TABLES
-- ------------------------------------------------------------------------------
-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_your_price ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- admin_profiles
DROP POLICY IF EXISTS "admin_profiles_staff_read" ON public.admin_profiles;
CREATE POLICY "admin_profiles_staff_read" ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (public.is_staff() OR user_id = auth.uid());

DROP POLICY IF EXISTS "admin_profiles_admin_all" ON public.admin_profiles;
CREATE POLICY "admin_profiles_admin_all" ON public.admin_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- contact_submissions: staff can read and manage all; anyone can insert
DROP POLICY IF EXISTS "contact_submissions_insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions_insert" ON public.contact_submissions
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_submissions_staff_all" ON public.contact_submissions;
CREATE POLICY "contact_submissions_staff_all" ON public.contact_submissions
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- name_your_price: staff can read and manage all; public can insert; clients see own
DROP POLICY IF EXISTS "name_your_price_insert" ON public.name_your_price;
CREATE POLICY "name_your_price_insert" ON public.name_your_price
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "name_your_price_staff_all" ON public.name_your_price;
CREATE POLICY "name_your_price_staff_all" ON public.name_your_price
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "name_your_price_customer_select" ON public.name_your_price;
CREATE POLICY "name_your_price_customer_select" ON public.name_your_price
  FOR SELECT TO authenticated
  USING (
    customer_email = (SELECT email FROM public.customer_profiles WHERE id = auth.uid() LIMIT 1)
  );

-- chat_conversations: anyone can insert/read; staff can do all
DROP POLICY IF EXISTS "chat_conversations_public_insert" ON public.chat_conversations;
CREATE POLICY "chat_conversations_public_insert" ON public.chat_conversations
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conversations_public_select" ON public.chat_conversations;
CREATE POLICY "chat_conversations_public_select" ON public.chat_conversations
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "chat_conversations_public_update" ON public.chat_conversations;
CREATE POLICY "chat_conversations_public_update" ON public.chat_conversations
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conversations_staff_all" ON public.chat_conversations;
CREATE POLICY "chat_conversations_staff_all" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- chat_messages: anyone can insert/read; staff can do all
DROP POLICY IF EXISTS "chat_messages_public_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_public_select" ON public.chat_messages;
CREATE POLICY "chat_messages_public_select" ON public.chat_messages
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "chat_messages_staff_all" ON public.chat_messages;
CREATE POLICY "chat_messages_staff_all" ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- page_visits
DROP POLICY IF EXISTS "page_visits_insert" ON public.page_visits;
CREATE POLICY "page_visits_insert" ON public.page_visits
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "page_visits_staff_all" ON public.page_visits;
CREATE POLICY "page_visits_staff_all" ON public.page_visits
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- 6. REALTIME REPLICATION RE-ASSERTION
-- ------------------------------------------------------------------------------
-- Ensure tables are published to realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.name_your_price;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

COMMIT;
