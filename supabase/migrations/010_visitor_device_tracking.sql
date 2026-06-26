-- Add visitor/device tracking columns to page_visits
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS screen_width INTEGER;
