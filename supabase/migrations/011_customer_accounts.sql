-- Customer profiles (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer properties (a customer can have multiple properties)
CREATE TABLE IF NOT EXISTS customer_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Primary', -- e.g. "Primary", "Rental #1", "Mom's House"
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL DEFAULT 'Rome',
  state TEXT NOT NULL DEFAULT 'GA',
  zip TEXT NOT NULL,
  area TEXT, -- West Rome, North Rome, East Rome, South Rome, Downtown, Clocktower Hill
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential', 'commercial', 'multi-unit')),
  year_built INTEGER,
  square_footage INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription tiers reference table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY, -- 'essential', 'proactive', 'comprehensive'
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, -- monthly price in cents
  discount_percent INTEGER DEFAULT 0, -- discount on quoted services
  dispatch_fee_waived BOOLEAN DEFAULT false,
  priority_level INTEGER DEFAULT 0, -- higher = faster response
  included_labor_hours NUMERIC(4,1) DEFAULT 0, -- monthly included hours
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer subscriptions (active subscription state per property)
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES customer_properties(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
  started_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT, -- for Stripe integration later
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id) -- one active subscription per property
);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Customers can read/update their own profile
CREATE POLICY "Customers can view own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Customers can manage their own properties
CREATE POLICY "Customers can view own properties"
  ON customer_properties FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own properties"
  ON customer_properties FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own properties"
  ON customer_properties FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own properties"
  ON customer_properties FOR DELETE
  USING (auth.uid() = customer_id);

-- Subscription tiers are public read
CREATE POLICY "Anyone can read subscription tiers"
  ON subscription_tiers FOR SELECT
  USING (true);

-- Customers can view their own subscriptions
CREATE POLICY "Customers can view own subscriptions"
  ON customer_subscriptions FOR SELECT
  USING (auth.uid() = customer_id);

-- Admin full access to all customer tables
CREATE POLICY "Admin full access customer_profiles"
  ON customer_profiles FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admin full access customer_properties"
  ON customer_properties FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admin full access customer_subscriptions"
  ON customer_subscriptions FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Seed the subscription tiers
INSERT INTO subscription_tiers (id, name, price_cents, discount_percent, dispatch_fee_waived, priority_level, included_labor_hours, description) VALUES
  ('essential', 'Essential', 9900, 5, false, 1, 0, 'Bi-annual preventative maintenance, seasonal checks, and standard work order access.'),
  ('proactive', 'Proactive', 19900, 12, false, 2, 2.0, 'Quarterly maintenance, 2 hours included labor, 48-hour guaranteed response.'),
  ('comprehensive', 'Comprehensive', 39900, 20, true, 3, 5.0, 'Monthly check-ins, 5 hours included labor, emergency dispatch, trade coordination.')
ON CONFLICT (id) DO NOTHING;

-- Auto-create customer profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_customer') THEN
    CREATE TRIGGER on_auth_user_created_customer
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_customer();
  END IF;
END;
$$;
