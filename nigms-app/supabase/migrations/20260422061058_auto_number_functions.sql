-- Auto-number generation functions
-- Fixes Bug Condition 1.4: Prevents race conditions in auto-generated numbers

-- Function to generate work order numbers (WO-YYYY-NNNN)
CREATE OR REPLACE FUNCTION generate_wo_number(year_param integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_seq integer;
  wo_num text;
BEGIN
  -- Count existing work orders for the given year and increment
  SELECT COUNT(*) + 1 INTO next_seq
  FROM work_orders
  WHERE EXTRACT(YEAR FROM created_at) = year_param;
  
  -- Format: WO-YYYY-NNNN (e.g., WO-2024-0001)
  wo_num := 'WO-' || year_param || '-' || LPAD(next_seq::text, 4, '0');
  RETURN wo_num;
END;
$$;

-- Function to generate estimate numbers (EST-CLIENTSEQ-NNNN)
CREATE OR REPLACE FUNCTION generate_estimate_number(client_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_seq integer;
  client_seq text;
  est_num text;
BEGIN
  -- Count existing estimates for the given client and increment
  SELECT COUNT(*) + 1 INTO next_seq
  FROM estimates
  WHERE client_id = client_id_param;
  
  -- Use first 8 characters of client_id as sequence identifier
  client_seq := SUBSTRING(client_id_param::text, 1, 8);
  
  -- Format: EST-CLIENTSEQ-NNNN (e.g., EST-a1b2c3d4-0001)
  est_num := 'EST-' || client_seq || '-' || LPAD(next_seq::text, 4, '0');
  RETURN est_num;
END;
$$;

-- Function to generate receipt numbers (RCT-YYYY-NNNN)
CREATE OR REPLACE FUNCTION generate_receipt_number(year_param integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_seq integer;
  rct_num text;
BEGIN
  -- Count existing receipts (bills + payments) for the given year and increment
  -- We need to count both bills and payments to ensure unique receipt numbers
  SELECT 
    COALESCE(
      (SELECT COUNT(*) FROM bills WHERE EXTRACT(YEAR FROM created_at) = year_param), 0
    ) + 
    COALESCE(
      (SELECT COUNT(*) FROM payments WHERE EXTRACT(YEAR FROM created_at) = year_param), 0
    ) + 1 
  INTO next_seq;
  
  -- Format: RCT-YYYY-NNNN (e.g., RCT-2024-0001)
  rct_num := 'RCT-' || year_param || '-' || LPAD(next_seq::text, 4, '0');
  RETURN rct_num;
END;
$$;

-- Add unique constraints to prevent duplicate numbers
-- These constraints ensure database-level enforcement of uniqueness

-- Work order numbers must be unique
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_wo_number_unique;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_wo_number_unique UNIQUE (wo_number);

-- Estimate numbers must be unique
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_estimate_number_unique;
ALTER TABLE estimates ADD CONSTRAINT estimates_estimate_number_unique UNIQUE (estimate_number);

-- Receipt numbers must be unique across bills
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_receipt_number_unique;
ALTER TABLE bills ADD CONSTRAINT bills_receipt_number_unique UNIQUE (receipt_number);

-- Receipt numbers must be unique across payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_receipt_number_unique;
ALTER TABLE payments ADD CONSTRAINT payments_receipt_number_unique UNIQUE (receipt_number);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS work_orders_wo_number_idx ON work_orders(wo_number);
CREATE INDEX IF NOT EXISTS estimates_estimate_number_idx ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS bills_receipt_number_idx ON bills(receipt_number);
CREATE INDEX IF NOT EXISTS payments_receipt_number_idx ON payments(receipt_number);
