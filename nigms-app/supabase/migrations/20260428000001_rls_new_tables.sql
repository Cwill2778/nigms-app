-- RLS policies for tables added in 20240001_admin_dashboard_enhancements.sql
-- These tables were created without RLS; all app access goes through service-role
-- API routes, but enabling RLS here prevents any accidental direct client access.

-- messages
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

-- estimates
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

-- bills
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

-- time_entries (admin-only; clients don't need direct access)
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_time_entries" ON public.time_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
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

-- onboarding_states
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

-- properties
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
