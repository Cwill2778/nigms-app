import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/promo/redeem
 * Redeems a promo code for the authenticated user.
 *
 * Body: { code: string }
 *
 * On vip_bypass:
 *   - Updates user role to 'vip_client'
 *   - Creates a $0 subscription record with tier='vip' and monthly_allocation_minutes=240
 *   - Inserts promo_redemptions record
 *   - Increments times_redeemed
 *
 * On discount:
 *   - Inserts promo_redemptions record
 *   - Increments times_redeemed
 *   - Returns discount details for use in checkout
 *
 * Requirements: 6.6, 6.7, 6.8, 6.9, 6.10
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { code } = body as { code?: string };

  if (!code || typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  // Re-validate the code (prevent race conditions)
  const { data: promoCode, error: lookupError } = await db
    .from('promo_codes')
    .select('id, code, code_type, discount_percentage, is_active, max_redemptions, times_redeemed')
    .ilike('code', code.trim())
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
  }

  if (!promoCode || !promoCode.is_active) {
    return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 404 });
  }

  // Check max redemptions
  if (
    promoCode.max_redemptions !== null &&
    promoCode.times_redeemed >= promoCode.max_redemptions
  ) {
    return NextResponse.json(
      { error: 'This promo code has reached its maximum redemptions' },
      { status: 409 }
    );
  }

  // Check if already redeemed by this user (Requirement 6.10)
  const { data: existingRedemption } = await db
    .from('promo_redemptions')
    .select('id')
    .eq('promo_code_id', promoCode.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (existingRedemption) {
    return NextResponse.json(
      { error: 'This promo code has already been redeemed on your account' },
      { status: 409 }
    );
  }

  // Insert redemption record
  const { error: redemptionError } = await db.from('promo_redemptions').insert({
    promo_code_id: promoCode.id,
    user_id: session.user.id,
  });

  if (redemptionError) {
    return NextResponse.json({ error: redemptionError.message }, { status: 500 });
  }

  // Increment times_redeemed
  await db
    .from('promo_codes')
    .update({ times_redeemed: promoCode.times_redeemed + 1 })
    .eq('id', promoCode.id);

  if (promoCode.code_type === 'vip_bypass') {
    // Update user role to vip_client (Requirement 6.6, 6.8)
    const { error: roleError } = await db
      .from('users')
      .update({ role: 'vip_client' })
      .eq('id', session.user.id);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    // Get the user's first property (if any) to associate the VIP subscription
    const { data: properties } = await db
      .from('properties')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const propertyId = properties?.[0]?.id ?? null;

    // Create a $0 VIP subscription record (Requirement 6.6)
    if (propertyId) {
      await db.from('subscriptions').insert({
        user_id: session.user.id,
        property_id: propertyId,
        tier: 'vip',
        status: 'active',
        monthly_allocation_minutes: 240,
        minutes_used: 0,
      });
    }

    // Mark onboarding as complete
    await db
      .from('onboarding_states')
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('user_id', session.user.id);

    return NextResponse.json({
      success: true,
      code_type: 'vip_bypass',
      message: 'VIP Access Granted. Welcome to the Elite Standard.',
    });
  }

  // discount type
  return NextResponse.json({
    success: true,
    code_type: 'discount',
    discount_percentage: promoCode.discount_percentage,
    message: `${promoCode.discount_percentage}% discount applied to your subscription.`,
  });
}
