-- Dwell time tracking (active engagement time)
CREATE TABLE IF NOT EXISTS dwell_time (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  active_seconds INTEGER NOT NULL, -- only counts time user was actively engaged
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dwell_time ENABLE ROW LEVEL SECURITY;

-- Public can insert dwell time events
CREATE POLICY "Public can insert dwell time" ON dwell_time FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access dwell time" ON dwell_time FOR ALL USING (auth.role() = 'authenticated');
