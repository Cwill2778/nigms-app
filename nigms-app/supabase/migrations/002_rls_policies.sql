-- ============================================================
-- 002_rls_policies.sql
-- Row-Level Security policies for all tables
-- ============================================================

-- ─── users ───────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_user" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── properties ──────────────────────────────────────────────────────────────

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_properties" ON public.properties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_properties" ON public.properties
  FOR ALL USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── subscriptions ───────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── promo_codes ─────────────────────────────────────────────────────────────
-- Clients have NO direct access; validation goes through API routes.

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_promo_codes" ON public.promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ─── promo_redemptions ───────────────────────────────────────────────────────

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_promo_redemptions" ON public.promo_redemptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_promo_redemptions" ON public.promo_redemptions
  FOR SELECT USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── work_orders ─────────────────────────────────────────────────────────────

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_work_orders" ON public.work_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- NULL client_id rows (anonymous bookings) are only visible to admins.
CREATE POLICY "client_own_work_orders" ON public.work_orders
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── time_entries ────────────────────────────────────────────────────────────
-- Clients have NO direct access; time data is surfaced via work order details.

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_time_entries" ON public.time_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ─── quotes ──────────────────────────────────────────────────────────────────

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_quotes" ON public.quotes
  FOR SELECT USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── invoices ────────────────────────────────────────────────────────────────

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_invoices" ON public.invoices
  FOR SELECT USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── messages ────────────────────────────────────────────────────────────────

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_messages" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_messages" ON public.messages
  FOR ALL USING (
    (sender_id = auth.uid() OR recipient_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── appointments ────────────────────────────────────────────────────────────

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_appointments" ON public.appointments
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── maintenance_reminders ───────────────────────────────────────────────────

ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_maintenance_reminders" ON public.maintenance_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Clients can read reminders for their own properties.
CREATE POLICY "client_read_own_maintenance_reminders" ON public.maintenance_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = maintenance_reminders.property_id
        AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── before_after_gallery ────────────────────────────────────────────────────

ALTER TABLE public.before_after_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_before_after_gallery" ON public.before_after_gallery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_read_own_before_after_gallery" ON public.before_after_gallery
  FOR SELECT USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── materials ───────────────────────────────────────────────────────────────

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_materials" ON public.materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Clients can read materials for their own work orders.
CREATE POLICY "client_read_own_materials" ON public.materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = materials.work_order_id
        AND wo.client_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- ─── audit_log ───────────────────────────────────────────────────────────────
-- Admins can read; clients have NO access.

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit_log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ─── onboarding_states ───────────────────────────────────────────────────────

ALTER TABLE public.onboarding_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_onboarding_states" ON public.onboarding_states
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_onboarding_state" ON public.onboarding_states
  FOR ALL USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
    )
  );

-- ─── app_settings ────────────────────────────────────────────────────────────
-- Admins have full access; clients have NO access.

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_app_settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ─── Legacy Table Policies ───────────────────────────────────────────────────

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_payments" ON public.payments
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_newsletter" ON public.newsletter_subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- estimates (legacy)
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_estimates" ON public.estimates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_estimates" ON public.estimates
  FOR SELECT USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- bills (legacy)
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_bills" ON public.bills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_bills" ON public.bills
  FOR SELECT USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- change_orders
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_change_orders" ON public.change_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_change_orders" ON public.change_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = change_orders.work_order_id
        AND wo.client_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- client_addresses
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_client_addresses" ON public.client_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_addresses" ON public.client_addresses
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- work_order_pictures
ALTER TABLE public.work_order_pictures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pictures" ON public.work_order_pictures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_pictures" ON public.work_order_pictures
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );

-- gallery (public project showcase — anyone can read)
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_public_read" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "gallery_admin_all" ON public.gallery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- assurance_subscriptions (legacy)
ALTER TABLE public.assurance_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_assurance_subscriptions" ON public.assurance_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "client_own_assurance_subscription" ON public.assurance_subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );
