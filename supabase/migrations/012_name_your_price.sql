-- Name Your Price submissions
CREATE TABLE IF NOT EXISTS name_your_price (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  description TEXT NOT NULL,
  offered_price INTEGER NOT NULL CHECK (offered_price >= 5500 AND offered_price <= 249900), -- stored in cents
  attachments JSONB DEFAULT '[]', -- array of storage paths
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'accepted', 'countered', 'declined')),
  admin_notes TEXT,
  counter_price INTEGER, -- admin counter-offer in cents
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE name_your_price ENABLE ROW LEVEL SECURITY;

-- Public can insert submissions
CREATE POLICY "Public can submit name your price"
  ON name_your_price FOR INSERT
  WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access name_your_price"
  ON name_your_price FOR ALL
  USING (auth.role() = 'authenticated');

-- Push subscription storage (for web push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can read all push subscriptions (to send notifications)
CREATE POLICY "Admin full access push_subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'authenticated');
