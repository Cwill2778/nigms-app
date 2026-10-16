-- Migration: 20261016_property_equipment_customer_crud.sql
-- Description: Allow authenticated customers to insert, update, and delete equipment on their own properties

BEGIN;

-- Enable RLS just in case
ALTER TABLE public.property_equipment ENABLE ROW LEVEL SECURITY;

-- 1. Customers can insert equipment on properties they own
DROP POLICY IF EXISTS "property_equipment_customer_insert" ON public.property_equipment;
CREATE POLICY "property_equipment_customer_insert" ON public.property_equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );

-- 2. Customers can update equipment on properties they own
DROP POLICY IF EXISTS "property_equipment_customer_update" ON public.property_equipment;
CREATE POLICY "property_equipment_customer_update" ON public.property_equipment
  FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );

-- 3. Customers can delete equipment on properties they own
DROP POLICY IF EXISTS "property_equipment_customer_delete" ON public.property_equipment;
CREATE POLICY "property_equipment_customer_delete" ON public.property_equipment
  FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.customer_properties WHERE customer_id = auth.uid()
    )
  );

COMMIT;
