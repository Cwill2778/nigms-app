-- CRM Customers (Leads, Offline Customers, etc.)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  secondary_phone TEXT,
  role TEXT DEFAULT 'homeowner',
  status TEXT DEFAULT 'lead',
  subscription_tier TEXT DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage CRM customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
);

-- CRM Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL DEFAULT 'Rome',
  state TEXT NOT NULL DEFAULT 'GA',
  zip_code TEXT NOT NULL,
  zone TEXT,
  gate_code TEXT,
  square_footage INTEGER,
  unit_count INTEGER DEFAULT 1,
  year_built INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage CRM properties" ON properties FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
);
