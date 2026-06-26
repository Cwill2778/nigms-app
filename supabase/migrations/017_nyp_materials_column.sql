-- Add materials_supplied_by column to name_your_price
ALTER TABLE name_your_price ADD COLUMN IF NOT EXISTS materials_supplied_by TEXT DEFAULT 'customer' CHECK (materials_supplied_by IN ('customer', 'nailedit', 'unsure'));
