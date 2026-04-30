-- Track Assurance Program subscriptions per client
CREATE TABLE IF NOT EXISTS public.assurance_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id    TEXT,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assurance_subscriptions_user_idx ON public.assurance_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS assurance_subscriptions_stripe_idx ON public.assurance_subscriptions(stripe_subscription_id);

-- RLS
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
