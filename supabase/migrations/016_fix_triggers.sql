-- Drop the broken triggers that use pg_net incorrectly
DROP TRIGGER IF EXISTS on_new_nyp_submission ON name_your_price;
DROP TRIGGER IF EXISTS on_nyp_status_change ON name_your_price;
DROP FUNCTION IF EXISTS public.notify_new_nyp_submission();
DROP FUNCTION IF EXISTS public.notify_customer_nyp_response();
