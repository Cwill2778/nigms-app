-- ─── Promo Code Seeds ────────────────────────────────────────────────────────
-- Add promotional codes for campaigns.

INSERT INTO public.promo_codes (code, code_type, discount_percentage, is_active, max_redemptions)
VALUES
  ('HAMMER2026', 'vip_bypass', NULL, true, NULL)
ON CONFLICT (code) DO NOTHING;
