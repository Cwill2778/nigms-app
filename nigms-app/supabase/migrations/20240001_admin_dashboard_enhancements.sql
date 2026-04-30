-- Admin Dashboard Enhancements Migration
-- Creates new tables and adds columns to existing tables

-- messages table
CREATE TABLE IF NOT EXISTS messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  sender_role  text NOT NULL CHECK (sender_role IN ('admin', 'client')),
  body         text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at);

-- estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   uuid NOT NULL REFERENCES work_orders(id),
  client_id       uuid NOT NULL REFERENCES auth.users(id),
  estimate_number text NOT NULL UNIQUE,
  line_items      jsonb NOT NULL DEFAULT '[]',
  total_amount    numeric(10,2) NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- bills table
CREATE TABLE IF NOT EXISTS bills (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         uuid NOT NULL REFERENCES work_orders(id),
  client_id             uuid NOT NULL REFERENCES auth.users(id),
  receipt_number        text NOT NULL UNIQUE,
  materials_cost        numeric(10,2) NOT NULL DEFAULT 0,
  materials_paid_by     text NOT NULL CHECK (materials_paid_by IN ('company', 'client', 'both')),
  client_materials_cost numeric(10,2) NOT NULL DEFAULT 0,
  labor_cost            numeric(10,2) NOT NULL DEFAULT 0,
  total_billed          numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid           numeric(10,2) NOT NULL DEFAULT 0,
  balance_remaining     numeric(10,2) GENERATED ALWAYS AS (total_billed - amount_paid) STORED,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- change_orders table
CREATE TABLE IF NOT EXISTS change_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   uuid NOT NULL REFERENCES work_orders(id),
  description     text NOT NULL,
  additional_cost numeric(10,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id),
  started_at    timestamptz NOT NULL,
  stopped_at    timestamptz,
  duration_minutes integer GENERATED ALWAYS AS (CASE WHEN stopped_at IS NOT NULL THEN EXTRACT(EPOCH FROM (stopped_at - started_at))::integer / 60 ELSE NULL END) STORED,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- client_addresses table
CREATE TABLE IF NOT EXISTS client_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES auth.users(id),
  label      text,
  street     text NOT NULL,
  city       text NOT NULL,
  state      text NOT NULL DEFAULT 'GA',
  zip        text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- work_order_pictures table
CREATE TABLE IF NOT EXISTS work_order_pictures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id),
  client_id     uuid NOT NULL REFERENCES auth.users(id),
  storage_path  text NOT NULL,
  caption       text,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

-- work_orders new columns
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS wo_number text UNIQUE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS urgency text CHECK (urgency IN ('low', 'medium', 'high', 'emergency'));
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS property_address text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS inspection_notes text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS total_billable_minutes integer NOT NULL DEFAULT 0;

-- Update work_orders status constraint to include 'accepted'
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check 
  CHECK (status IN ('pending', 'in_progress', 'accepted', 'completed', 'cancelled'));

-- users new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- payments new columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number text UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date date;
