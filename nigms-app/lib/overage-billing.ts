import { stripe } from './stripe';
import { getOverageRate } from './subscription-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverageResult {
  /** Number of minutes consumed beyond the monthly allocation */
  overageMinutes: number;
  /** Total charge amount in USD */
  chargeAmount: number;
}

// ─── calculateOverage ─────────────────────────────────────────────────────────

/**
 * Computes the overage minutes and charge amount for a given usage/allocation pair.
 *
 * Requirement 4.3: base rate $0.8042/min with tier discounts applied.
 *
 * @param minutesUsed  - Total minutes consumed this period
 * @param allocation   - Monthly allocation for the subscription tier
 * @param tier         - Subscription tier string (essential | elevated | elite | vip)
 * @returns OverageResult with overageMinutes and chargeAmount (USD)
 */
export function calculateOverage(
  minutesUsed: number,
  allocation: number,
  tier: string
): OverageResult {
  const overageMinutes = Math.max(0, minutesUsed - allocation);
  const rate = getOverageRate(tier);
  const chargeAmount = overageMinutes * rate;
  return { overageMinutes, chargeAmount };
}

// ─── chargeOverage ────────────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent for the overage amount and confirms it
 * off-session against the customer's saved payment method.
 *
 * Requirement 4.3: automatically generate a Stripe charge for overage at the
 * client's tier-discounted rate.
 *
 * @param stripeCustomerId - Stripe customer ID for the client
 * @param overageMinutes   - Number of overage minutes to charge
 * @param tier             - Subscription tier string
 * @returns The Stripe PaymentIntent ID
 */
export async function chargeOverage(
  stripeCustomerId: string,
  overageMinutes: number,
  tier: string
): Promise<string> {
  const rate = getOverageRate(tier);
  const amountCents = Math.round(overageMinutes * rate * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: stripeCustomerId,
    description: `Overage charge: ${overageMinutes} minutes at $${rate.toFixed(4)}/min`,
    metadata: {
      overage_minutes: overageMinutes.toString(),
      tier,
    },
    confirm: true,
    off_session: true,
  });

  return paymentIntent.id;
}
