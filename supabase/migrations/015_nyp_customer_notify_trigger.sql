-- Trigger function to email customer when their submission status changes
CREATE OR REPLACE FUNCTION public.notify_customer_nyp_response()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  edge_function_url TEXT;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify on customer-facing statuses
  IF NEW.status NOT IN ('accepted', 'countered', 'declined') THEN
    RETURN NEW;
  END IF;

  -- Only notify if customer has an email
  IF NEW.customer_email IS NULL OR NEW.customer_email = '' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  edge_function_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/notify-customer-response';

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

-- Create trigger on name_your_price updates
DROP TRIGGER IF EXISTS on_nyp_status_change ON name_your_price;
CREATE TRIGGER on_nyp_status_change
  AFTER UPDATE ON name_your_price
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_nyp_response();
