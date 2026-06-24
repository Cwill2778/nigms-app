-- Exit tracking analytics
CREATE TABLE IF NOT EXISTS exit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  time_on_page INTEGER NOT NULL, -- seconds spent on the page
  exit_type TEXT NOT NULL CHECK (exit_type IN ('leave_site', 'tab_hidden', 'navigate')),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exit_events ENABLE ROW LEVEL SECURITY;

-- Public can insert exit events
CREATE POLICY "Public can insert exit events" ON exit_events FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access exit events" ON exit_events FOR ALL USING (auth.role() = 'authenticated');
