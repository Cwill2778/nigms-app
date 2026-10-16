-- ==============================================================================
-- Migration: 20261015_clean_rbac_rls.sql
-- Description: Clean-slate wipe, grant fix, and rebuild of Supabase RBAC & RLS
-- Target: naileditpropertysolutions.com (Supabase)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. BASE TABLE & SCHEMA PRIVILEGES (PREVENT ERROR 42501 & LOCK OUT ANON)
-- ==============================================================================

-- First, completely strip all base permissions from anon across all tables/sequences in public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Ensure schema usage is available
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Authenticated users (logged-in clients, staff, admins) have base access subject to RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure default grants for future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Whitelist ONLY public content for anonymous (unauthenticated) visitors
GRANT SELECT ON TABLE 
  public.reviews, 
  public.faqs, 
  public.site_settings, 
  public.subscription_tiers 
TO anon;

-- Whitelist ONLY public forms (insert only) for anonymous visitors
GRANT INSERT ON TABLE 
  public.contact_submissions, 
  public.career_applications, 
  public.reviews, 
  public.name_your_price,
  public.page_visits,
  public.scroll_depth,
  public.click_events,
  public.exit_events,
  public.form_abandonment,
  public.dwell_time,
  public.lead_attribution
TO anon;

-- Whitelist live chat for anonymous visitors
GRANT INSERT, SELECT, UPDATE ON TABLE 
  public.chat_conversations, 
  public.chat_messages 
TO anon;


-- ==============================================================================
-- 2. SCHEMA COLUMN NORMALIZATION FOR ROLES
-- ==============================================================================

ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';


-- ==============================================================================
-- 3. UNIFIED USER PROFILES VIEW & NON-RECURSIVE ROLE HELPER FUNCTIONS
-- ==============================================================================

-- Create unified view for all users (clients, investors, techs, admins)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  COALESCE(role, 'client')::text AS role
FROM public.customer_profiles
UNION ALL
SELECT 
  user_id AS id,
  email,
  first_name,
  last_name,
  COALESCE(role, 'admin')::text AS role
FROM public.admin_profiles;

GRANT SELECT ON public.user_profiles TO authenticated;

-- Cached, non-recursive SECURITY DEFINER role lookup
-- Bypasses RLS on underlying profile tables and never accesses auth.users directly
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.admin_profiles WHERE user_id = auth.uid() LIMIT 1),
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
SET search_path = public
AS $$
  SELECT public.get_my_role() = 'admin';
$$;

-- Helper to check if current user is Staff (Admin or Field Technician)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role() IN ('admin', 'technician');
$$;


-- ==============================================================================
-- 4. CLEAN-SLATE WIPE OF ALL EXISTING PUBLIC RLS POLICIES
-- ==============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;


-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY ON ALL RELEVANT TABLES
-- ==============================================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.property_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_attachments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.name_your_price ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scroll_depth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_abandonment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwell_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 6. REBUILD CLEAN POLICIES: AUTH & PROFILES
-- ==============================================================================

-- admin_profiles
CREATE POLICY "admin_profiles_admin_all" ON public.admin_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_profiles_read_own" ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- customer_profiles
CREATE POLICY "customer_profiles_staff_all" ON public.customer_profiles
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "customer_profiles_user_select" ON public.customer_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "customer_profiles_user_insert" ON public.customer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "customer_profiles_user_update" ON public.customer_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ==============================================================================
-- 7. REBUILD CLEAN POLICIES: PORTAL PROPERTIES & SUBSCRIPTIONS
-- ==============================================================================

-- customer_properties (client & investor row-ownership)
CREATE POLICY "customer_properties_staff_all" ON public.customer_properties
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "customer_properties_user_select" ON public.customer_properties
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "customer_properties_user_insert" ON public.customer_properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_properties_user_update" ON public.customer_properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_properties_user_delete" ON public.customer_properties
  FOR DELETE TO authenticated
  USING (auth.uid() = customer_id);

-- customer_subscriptions
CREATE POLICY "customer_subscriptions_admin_all" ON public.customer_subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "customer_subscriptions_user_select" ON public.customer_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- subscription_tiers
CREATE POLICY "subscription_tiers_public_select" ON public.subscription_tiers
  FOR SELECT TO public
  USING (true);

CREATE POLICY "subscription_tiers_admin_all" ON public.subscription_tiers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 8. REBUILD CLEAN POLICIES: CRM TABLES (CUSTOMERS, PROPERTIES, ASSETS)
-- ==============================================================================

-- customers (CRM)
CREATE POLICY "customers_staff_all" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- properties (CRM)
CREATE POLICY "properties_staff_all" ON public.properties
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- assets
CREATE POLICY "assets_staff_all" ON public.assets
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "assets_customer_select" ON public.assets
  FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );


-- ==============================================================================
-- 9. REBUILD CLEAN POLICIES: WORK ORDERS & MATERIALS
-- ==============================================================================

-- work_orders
CREATE POLICY "work_orders_staff_all" ON public.work_orders
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "work_orders_customer_select" ON public.work_orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "work_orders_customer_insert" ON public.work_orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- work_order_materials
CREATE POLICY "work_order_materials_staff_all" ON public.work_order_materials
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "work_order_materials_customer_select" ON public.work_order_materials
  FOR SELECT TO authenticated
  USING (
    work_order_id IN (
      SELECT id FROM public.work_orders WHERE customer_id = auth.uid()
    )
  );


-- ==============================================================================
-- 10. REBUILD CLEAN POLICIES: VERIFIED PROPERTY RECORDS & LIFECYCLE
-- ==============================================================================

-- property_equipment
CREATE POLICY "property_equipment_staff_all" ON public.property_equipment
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "property_equipment_customer_select" ON public.property_equipment
  FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );

-- property_records
CREATE POLICY "property_records_staff_all" ON public.property_records
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "property_records_customer_select" ON public.property_records
  FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );

-- record_attachments
CREATE POLICY "record_attachments_staff_all" ON public.record_attachments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "record_attachments_customer_select" ON public.record_attachments
  FOR SELECT TO authenticated
  USING (
    record_id IN (
      SELECT id FROM public.property_records 
      WHERE property_id IN (
        SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
      )
    )
  );


-- ==============================================================================
-- 11. REBUILD CLEAN POLICIES: PUBLIC LEADS, QUOTES & COMMUNICATION
-- ==============================================================================

-- name_your_price
CREATE POLICY "name_your_price_insert" ON public.name_your_price
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "name_your_price_staff_all" ON public.name_your_price
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "name_your_price_customer_select" ON public.name_your_price
  FOR SELECT TO authenticated
  USING (
    customer_email = (SELECT email FROM public.customer_profiles WHERE id = auth.uid() LIMIT 1)
  );

-- contact_submissions
CREATE POLICY "contact_submissions_insert" ON public.contact_submissions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "contact_submissions_staff_all" ON public.contact_submissions
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- career_applications
CREATE POLICY "career_applications_insert" ON public.career_applications
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "career_applications_staff_all" ON public.career_applications
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- reviews
CREATE POLICY "reviews_public_select" ON public.reviews
  FOR SELECT TO public
  USING (published = true);

CREATE POLICY "reviews_public_insert" ON public.reviews
  FOR INSERT TO public
  WITH CHECK (published = false);

CREATE POLICY "reviews_staff_all" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- faqs
CREATE POLICY "faqs_public_select" ON public.faqs
  FOR SELECT TO public
  USING (published = true);

CREATE POLICY "faqs_staff_all" ON public.faqs
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- site_settings
CREATE POLICY "site_settings_public_select" ON public.site_settings
  FOR SELECT TO public
  USING (true);

CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- push_subscriptions
CREATE POLICY "push_subscriptions_admin_all" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "push_subscriptions_user_select" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_user_insert" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_user_delete" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- live chat: conversations
CREATE POLICY "chat_conversations_public_insert" ON public.chat_conversations
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "chat_conversations_public_select" ON public.chat_conversations
  FOR SELECT TO public
  USING (true);

CREATE POLICY "chat_conversations_public_update" ON public.chat_conversations
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chat_conversations_staff_all" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- live chat: messages
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "chat_messages_public_select" ON public.chat_messages
  FOR SELECT TO public
  USING (true);

CREATE POLICY "chat_messages_staff_all" ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());


-- ==============================================================================
-- 12. REBUILD CLEAN POLICIES: ANALYTICS & TELEMETRY TABLES
-- ==============================================================================

-- page_visits
CREATE POLICY "page_visits_insert" ON public.page_visits FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "page_visits_staff_all" ON public.page_visits FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- scroll_depth
CREATE POLICY "scroll_depth_insert" ON public.scroll_depth FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "scroll_depth_staff_all" ON public.scroll_depth FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- click_events
CREATE POLICY "click_events_insert" ON public.click_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "click_events_staff_all" ON public.click_events FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- exit_events
CREATE POLICY "exit_events_insert" ON public.exit_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "exit_events_staff_all" ON public.exit_events FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- form_abandonment
CREATE POLICY "form_abandonment_insert" ON public.form_abandonment FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "form_abandonment_staff_all" ON public.form_abandonment FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- dwell_time
CREATE POLICY "dwell_time_insert" ON public.dwell_time FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "dwell_time_staff_all" ON public.dwell_time FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- lead_attribution
CREATE POLICY "lead_attribution_insert" ON public.lead_attribution FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "lead_attribution_staff_all" ON public.lead_attribution FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());


-- ==============================================================================
-- 13. STORAGE BUCKET POLICIES (NYP ATTACHMENTS & PROPERTY RECORDS)
-- ==============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Dynamically drop any existing storage policies for these buckets
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND (
            policyname ILIKE '%nyp%' 
            OR policyname ILIKE '%property%record%'
          )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
    END LOOP;

    -- Explicit drops for all known policy names
    DROP POLICY IF EXISTS "Public can upload nyp attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read nyp attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Admin can delete nyp attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Staff can delete nyp attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Give public access to property records bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Give admins upload access to property records bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Staff can upload property records" ON storage.objects;
    DROP POLICY IF EXISTS "Staff can delete property records" ON storage.objects;

    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'nyp-attachments') THEN
      CREATE POLICY "Public can upload nyp attachments" ON storage.objects 
        FOR INSERT TO public WITH CHECK (bucket_id = 'nyp-attachments');
      CREATE POLICY "Public can read nyp attachments" ON storage.objects 
        FOR SELECT TO public USING (bucket_id = 'nyp-attachments');
      CREATE POLICY "Staff can delete nyp attachments" ON storage.objects 
        FOR DELETE TO authenticated USING (bucket_id = 'nyp-attachments' AND public.is_staff());
    END IF;

    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-records') THEN
      CREATE POLICY "Give public access to property records bucket" ON storage.objects 
        FOR SELECT TO public USING (bucket_id = 'property-records');
      CREATE POLICY "Staff can upload property records" ON storage.objects 
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-records' AND public.is_staff());
      CREATE POLICY "Staff can delete property records" ON storage.objects 
        FOR DELETE TO authenticated USING (bucket_id = 'property-records' AND public.is_staff());
    END IF;
END $$;

COMMIT;