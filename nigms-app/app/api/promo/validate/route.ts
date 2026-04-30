import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/promo/validate
 * Validates a promo code against the Supabase promo_codes table.
 *
 * Body: { code: string }
 * Returns:
 *   200 { valid: true, code_type, discount_percentage, promo_code_id }
 *   200 { valid: false, error: string }
 *   409 { valid: false, error: 'already redeemed' } — if already redeemed by this user
 *
 * Requirements: 6.3, 6.4, 6.5
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { code } = body as { code?: string };

  if (!code || typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ valid: false, error: 'Promo code is required' });
  }

  const db = getServiceRoleClient();

  // Look up the promo code in Supabase
  const { data: promoCode, error: lookupError } = await db
    .from('promo_codes')
    .select('id, code, code_type, discount_percentage, is_active, max_redemptions, times_redeemed')
    .ilike('code', code.trim())
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ valid: false, error: 'Failed to validate code' }, { status: 500 });
  }

  if (!promoCode || !promoCode.is_active) {
    return NextResponse.json({ valid: false, error: 'Invalid or inactive promo code' });
  }

  // Check max redemptions
  if (
    promoCode.max_redemptions !== null &&
    promoCode.times_redeemed >= promoCode.max_redemptions
  ) {
    return NextResponse.json({ valid: false, error: 'This promo code has reached its maximum redemptions' });
  }

  // Check if the authenticated user has already redeemed this code (Requirement 6.10)
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: existingRedemption } = await db
      .from('promo_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingRedemption) {
      return NextResponse.json(
        { valid: false, error: 'This promo code has already been redeemed on your account' },
        { status: 409 }
      );
    }
  }

  return NextResponse.json({
    valid: true,
    code_type: promoCode.code_type,
    discount_percentage: promoCode.discount_percentage,
    promo_code_id: promoCode.id,
  });
}
