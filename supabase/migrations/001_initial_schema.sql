-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  text TEXT NOT NULL,
  date TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promo settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page visits (simple analytics)
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  interest TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Career applications
CREATE TABLE IF NOT EXISTS career_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published reviews" ON reviews FOR SELECT USING (published = true);
CREATE POLICY "Public can read published faqs" ON faqs FOR SELECT USING (published = true);
CREATE POLICY "Public can read site settings" ON site_settings FOR SELECT USING (true);

-- Public can insert page visits
CREATE POLICY "Public can insert page visits" ON page_visits FOR INSERT WITH CHECK (true);

-- Authenticated users (admin) can do everything
CREATE POLICY "Admin full access reviews" ON reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access faqs" ON faqs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access visits" ON page_visits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access contacts" ON contact_submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access careers" ON career_applications FOR ALL USING (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES 
  ('promo_banner', '{"enabled": true, "text": "LIMITED TIME: 25% Off Any Subscription Tier — Risk-Free, Money-Back Guarantee — Offer Ends Friday"}')
ON CONFLICT (key) DO NOTHING;

-- Insert existing reviews
INSERT INTO reviews (name, stars, text, date, published) VALUES
  ('Charlie Ford', 5, 'Charles is proactive and very detail oriented. He has helped cure my landlord woes.', 'March 2026', true),
  ('Shane Cronan', 5, 'They are very thorough and know their business. I would recommend them to anyone needing home repairs. They have the knowledge and can build anything, even a house from the ground up.', 'June 2026', true),
  ('Marcus Thompson', 5, 'Charles replaced our water heater the same day we called. Fair price for such a rapid response. Will be signing up for the subscription plan.', 'June 2026', true),
  ('Sandra & Bill Henderson', 5, 'We had three different contractors ghost us before finding Nailed It. Charles showed up, gave us an honest quote, and did the work right. No surprises on the bill, no headaches, and nothing left unfinished. Great work!', 'May 2026', true),
  ('David Reynolds', 5, 'The drywall finish in our kitchen looks really great. You can''t even tell where the old damage was. Great attention to detail and the built-in shelf was a nice bonus.', 'April 2026', true);

-- Insert existing FAQs
INSERT INTO faqs (question, answer, sort_order, published) VALUES
  ('What services does Nailed It Property Solutions specialize in?', 'We specialize in residential maintenance, reliable home repairs, and structured preventative care. From quick fixes and general installations to comprehensive upkeep, we ensure every patch, repair, and update stands the test of time. We also offer tiered preventative care plans designed to keep your home''s vital systems running smoothly year-round.', 1, true),
  ('What sets your business apart from other local home service providers?', 'We don''t believe in "dirt cheap and fast" band-aid fixes that just delay a bigger problem. To us, "nailed it" isn''t a casual catchphrase — it is a rigid standard of quality. We build our reputation on absolute respect for your home, clear communication from the moment we arrive, and the endurance to do things the right way the first time. We treat every property exactly like it''s our own.', 2, true),
  ('What is your primary service area?', 'We proudly serve homeowners and property managers right here across the Rome community and the surrounding local areas.', 3, true),
  ('Why do you emphasize preventative care and maintenance subscriptions?', 'A home is usually a person''s most expensive asset, and neglecting it always costs more down the road. Our mission is to provide affordable, proactive care today so you never have to face a stressful, costly 2:00 AM emergency — like a hot water heater failing — tomorrow. Meticulous attention to small details yields long-term peace of mind.', 4, true),
  ('How do you handle communication and customer service?', 'Inviting someone into your personal space takes trust. We honor that by providing clear updates, showing up on time, and showing absolute respect for your property. You will always know what to expect regarding the scope of work, timeline, and pricing.', 5, true);
