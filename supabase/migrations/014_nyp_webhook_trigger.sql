-- Trigger function to notify on new Name Your Price submission
-- This calls the Edge Functions via pg_net (Supabase's HTTP extension)
-- Note: pg_net must be enabled in your Supabase project (it is by default)

CREATE OR REPLACE FUNCTION public.notify_new_nyp_submission()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  edge_function_url TEXT;
BEGIN
  payload := jsonb_build_object('record', row_to_json(NEW));
  
  -- Call notify-new-lead Edge Function
  edge_function_url := current_setting('app.settings.supabase_url', true) 
    || '/functions/v1/notify-new-lead';
  
  PERFORM net.http_post(
    url := edge_function_url,
    body := payload::TEXT,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    )
  );

  -- Call email-new-lead Edge Function
  edge_function_url := current_setting('app.settings.supabase_url', true) 
    || '/functions/v1/email-new-lead';
  
  PERFORM net.http_post(
    url := edge_function_url,
    body := payload::TEXT,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on name_your_price inserts
DROP TRIGGER IF EXISTS on_new_nyp_submission ON name_your_price;
CREATE TRIGGER on_new_nyp_submission
  AFTER INSERT ON name_your_price
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_nyp_submission();
