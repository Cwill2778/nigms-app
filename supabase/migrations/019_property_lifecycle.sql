-- Equipment/Systems Tracker
CREATE TABLE IF NOT EXISTS property_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES customer_properties(id) ON DELETE CASCADE,
    equipment_type TEXT NOT NULL,
    brand TEXT,
    model_number TEXT,
    serial_number TEXT,
    install_date DATE,
    warranty_expiration DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Maintenance/Service Logs
CREATE TABLE IF NOT EXISTS property_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES customer_properties(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER,
    performed_by TEXT DEFAULT 'Nailed It Property Services',
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attachments for Records (Before/After photos, receipts)
CREATE TABLE IF NOT EXISTS record_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES property_records(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE property_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for property_equipment
CREATE POLICY "Admins full access equipment" ON property_equipment
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Customers view own equipment" ON property_equipment
  FOR SELECT USING (
    property_id IN (SELECT id FROM customer_properties WHERE customer_id = auth.uid())
  );

-- Policies for property_records
CREATE POLICY "Admins full access records" ON property_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Customers view own records" ON property_records
  FOR SELECT USING (
    property_id IN (SELECT id FROM customer_properties WHERE customer_id = auth.uid())
  );

-- Policies for record_attachments
CREATE POLICY "Admins full access attachments" ON record_attachments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Customers view own attachments" ON record_attachments
  FOR SELECT USING (
    record_id IN (
      SELECT id FROM property_records WHERE property_id IN (
        SELECT id FROM customer_properties WHERE customer_id = auth.uid()
      )
    )
  );

-- Insert dummy data into storage bucket for attachments if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('property-records', 'property-records', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to property records bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-records');

CREATE POLICY "Give admins upload access to property records bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-records' AND auth.role() = 'authenticated');
