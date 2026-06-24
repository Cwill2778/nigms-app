-- Form abandonment tracking
CREATE TABLE IF NOT EXISTS form_abandonment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  last_field TEXT, -- identifier of the last focused input
  fields_filled INTEGER DEFAULT 0,
  total_fields INTEGER DEFAULT 0,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE form_abandonment ENABLE ROW LEVEL SECURITY;

-- Public can insert form abandonment events
CREATE POLICY "Public can insert form abandonment" ON form_abandonment FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access form abandonment" ON form_abandonment FOR ALL USING (auth.role() = 'authenticated');
