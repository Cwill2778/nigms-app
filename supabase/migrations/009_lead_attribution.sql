-- End-to-end lead attribution
CREATE TABLE IF NOT EXISTS lead_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page TEXT NOT NULL,
  referrer TEXT,
  referrer_domain TEXT,
  channel TEXT NOT NULL, -- direct, organic_search, social, referral, paid_search, paid_social, email, etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  extra_params JSONB, -- gclid, fbclid, msclkid, etc.
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_attribution ENABLE ROW LEVEL SECURITY;

-- Public can insert attribution events
CREATE POLICY "Public can insert lead attribution" ON lead_attribution FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access lead attribution" ON lead_attribution FOR ALL USING (auth.role() = 'authenticated');
