import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/client/roi
 *
 * Computes ROI data for the authenticated client:
 *   - money_spent: sum of paid invoices (total_billed where paid_at IS NOT NULL)
 *                  + sum of subscription monthly amounts (monthly_allocation_minutes
 *                    used as a proxy for active subscription value)
 *   - money_saved: money_spent * multiplier, where multiplier comes from
 *                  app_settings table key 'roi_savings_multiplier' (default: 2.5)
 *
 * Returns: { money_spent: number, money_saved: number }
 *
 * Requirements: 7.9
 */

const DEFAULT_ROI_MULTIPLIER = 2.5;

// Tier monthly prices for subscription spend calculation
const TIER_MONTHLY_PRICE: Record<string, number> = {
  essential: 149,
  elevated: 249,
  elite: 399,
  vip: 0, // VIP is complimentary
};

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET() {
  // Authenticate the client
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user is a client (not admin)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (!role || role === 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const db = getServiceRoleClient();

  // ── 1. Sum paid invoices ──────────────────────────────────────────────────
  const { data: invoices, error: invoiceError } = await db
    .from('invoices')
    .select('total_billed')
    .eq('client_id', userId)
    .not('paid_at', 'is', null);

  if (invoiceError && invoiceError.code !== '42P01') {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  const invoiceTotal = ((invoices ?? []) as { total_billed: number }[]).reduce(
    (sum, inv) => sum + (inv.total_billed ?? 0),
    0,
  );

  // ── 2. Sum subscription charges ───────────────────────────────────────────
  // Use the tier's monthly price × number of active/past subscriptions as a
  // proxy for total subscription spend. For simplicity, count each subscription
  // record as one month's charge (the actual billing is handled by Stripe).
  const { data: subscriptions, error: subError } = await db
    .from('subscriptions')
    .select('tier, status, created_at, current_period_start, current_period_end')
    .eq('user_id', userId);

  if (subError && subError.code !== '42P01') {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  const subscriptionTotal = ((subscriptions ?? []) as {
    tier: string;
    status: string;
    created_at: string;
    current_period_start: string | null;
    current_period_end: string | null;
  }[]).reduce((sum, sub) => {
    const monthlyPrice = TIER_MONTHLY_PRICE[sub.tier] ?? 0;
    // Estimate months active: from created_at to now (or period end if cancelled)
    const startDate = new Date(sub.created_at);
    const endDate =
      sub.status === 'cancelled' && sub.current_period_end
        ? new Date(sub.current_period_end)
        : new Date();
    const monthsActive = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );
    return sum + monthlyPrice * monthsActive;
  }, 0);

  const money_spent = invoiceTotal + subscriptionTotal;

  // ── 3. Get ROI multiplier from app_settings ───────────────────────────────
  let multiplier = DEFAULT_ROI_MULTIPLIER;

  const { data: setting } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'roi_savings_multiplier')
    .maybeSingle();

  if (setting) {
    const raw = (setting as { value: unknown }).value;
    const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (!isNaN(parsed) && parsed > 0) {
      multiplier = parsed;
    }
  }

  const money_saved = money_spent * multiplier;

  return NextResponse.json({
    money_spent: Math.round(money_spent * 100) / 100,
    money_saved: Math.round(money_saved * 100) / 100,
  });
}
