-- Click tracking analytics
CREATE TABLE IF NOT EXISTS click_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  element_tag TEXT NOT NULL,
  element_text TEXT,
  element_href TEXT,
  element_id TEXT,
  element_class TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Public can insert click events
CREATE POLICY "Public can insert click events" ON click_events FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access click events" ON click_events FOR ALL USING (auth.role() = 'authenticated');
