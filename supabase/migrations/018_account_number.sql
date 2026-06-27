-- Add account_number column to customer_profiles
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- Function to generate account number: 100644-XXXX (random 4 digits)
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_number := '100644-' || lpad(floor(random() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM customer_profiles WHERE account_number = new_number) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update the signup trigger to assign account number
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, first_name, last_name, email, account_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    public.generate_account_number()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign account numbers to any existing profiles that don't have one
UPDATE customer_profiles
SET account_number = public.generate_account_number()
WHERE account_number IS NULL;
