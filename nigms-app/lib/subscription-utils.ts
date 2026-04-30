import { createClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from './types';

// ─── Tier Allocation ──────────────────────────────────────────────────────────

/**
 * Returns the monthly time allocation in minutes for a given subscription tier.
 *
 * Tier allocations per Requirements 3.2–3.4:
 *   - essential: 60 minutes
 *   - elevated:  120 minutes
 *   - elite:     240 minutes
 *   - vip:       240 minutes (same as elite)
 */
export function getTierAllocation(tier: string): number {
  switch (tier as SubscriptionTier) {
    case 'essential': return 60;
    case 'elevated':  return 120;
    case 'elite':     return 240;
    case 'vip':       return 240;
    default:          return 0;
  }
}

// ─── Overage Rates ────────────────────────────────────────────────────────────

/**
 * Returns the per-minute overage rate (USD) for a given subscription tier.
 *
 * Base rate: $0.8042/min ($48.25/hr)
 * Tier discounts per Requirement 4.3:
 *   - essential: 10% off → $0.7238/min
 *   - elevated:  15% off → $0.6835/min
 *   - elite/vip: 20% off → $0.6434/min
 *   - unknown:   base rate $0.8042/min
 */
export function getOverageRate(tier: string): number {
  switch (tier as SubscriptionTier) {
    case 'essential': return 0.7238;
    case 'elevated':  return 0.6835;
    case 'elite':     return 0.6434;
    case 'vip':       return 0.6434;
    default:          return 0.8042; // base rate for unrecognised tiers
  }
}

// ─── Monthly Allocation Reset ─────────────────────────────────────────────────

/**
 * Resets `minutes_used` to 0 for a single subscription.
 *
 * Uses the Supabase service-role client so it can bypass RLS.
 * Called by the monthly-reset Edge Function and can also be invoked
 * directly in tests or admin tooling.
 *
 * Requirement 3.5: use-it-or-lose-it; unused minutes do not carry over.
 */
export async function resetMonthlyAllocation(subscriptionId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('subscriptions')
    .update({ minutes_used: 0, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId);

  if (error) {
    throw new Error(`resetMonthlyAllocation failed for ${subscriptionId}: ${error.message}`);
  }
}
