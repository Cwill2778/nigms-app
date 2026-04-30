-- Allow quote requests from unauthenticated visitors (client_id = NULL)
-- These are submitted via the public /book form before a client account exists.
-- Admins can later assign them to a client once an account is created.
ALTER TABLE public.work_orders ALTER COLUMN client_id DROP NOT NULL;

-- Update the client_own_work_orders RLS policy to handle NULL client_id safely
-- (NULL client_id rows are only visible to admins, not to clients)
DROP POLICY IF EXISTS "client_own_work_orders" ON public.work_orders;

CREATE POLICY "client_own_work_orders" ON public.work_orders
  FOR ALL USING (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );
