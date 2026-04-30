-- Add computed columns to existing tables
-- Fixes Bug Conditions 1.1 and 1.2

-- Add balance_remaining computed column to bills table (no-op if already added by 20240001)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS balance_remaining numeric(10,2) GENERATED ALWAYS AS (total_billed - amount_paid) STORED;

-- Add duration_minutes computed column to time_entries table
-- Use IF EXISTS on DROP so this is safe to run even if the column doesn't exist yet
ALTER TABLE time_entries DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS duration_minutes integer GENERATED ALWAYS AS (CASE WHEN stopped_at IS NOT NULL THEN EXTRACT(EPOCH FROM (stopped_at - started_at))::integer / 60 ELSE NULL END) STORED;
