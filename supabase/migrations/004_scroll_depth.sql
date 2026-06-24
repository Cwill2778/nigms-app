-- Scroll depth analytics
CREATE TABLE IF NOT EXISTS scroll_depth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  max_depth INTEGER NOT NULL CHECK (max_depth >= 0 AND max_depth <= 100),
  milestones_hit JSONB DEFAULT '[]',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scroll_depth ENABLE ROW LEVEL SECURITY;

-- Public can insert scroll depth events
CREATE POLICY "Public can insert scroll depth" ON scroll_depth FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access scroll depth" ON scroll_depth FOR ALL USING (auth.role() = 'authenticated');
