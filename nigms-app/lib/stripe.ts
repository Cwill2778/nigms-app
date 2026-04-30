import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// ─── Tier Price IDs ───────────────────────────────────────────────────────────
// Set these in environment variables to use pre-configured Stripe prices.
// If not set, the checkout route falls back to inline price_data.
export const TIER_PRICE_IDS = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL ?? '',
  elevated: process.env.STRIPE_PRICE_ELEVATED ?? '',
  elite: process.env.STRIPE_PRICE_ELITE ?? '',
};

// ─── Tier Amounts (cents) ─────────────────────────────────────────────────────
// Fallback amounts used when price IDs are not configured.
export const TIER_AMOUNTS = {
  essential: 14900, // $149.00
  elevated: 24900, // $249.00
  elite: 39900,   // $399.00
};

// ─── Overage Rates (per minute, USD) ─────────────────────────────────────────
// Base rate: $0.8042/min ($48.25/hr)
// Tier discounts per Requirement 4.3:
//   Essential:  10% off → $0.7238/min ($43.43/hr)
//   Elevated:   15% off → $0.6835/min ($41.01/hr)
//   Elite/VIP:  20% off → $0.6434/min ($38.60/hr)
export const OVERAGE_RATES = {
  essential: 0.7238,
  elevated: 0.6835,
  elite: 0.6434,
  vip: 0.6434, // Same as elite
};

/**
 * Stripe Elements appearance configuration (Requirement 1.6)
 *
 * Applies the Nailed It brand identity to all Stripe-hosted payment UIs:
 *   - Precision Coral (#FF7F7F) as the primary accent color
 *   - Trust Navy (#1B263B) for text
 *   - Inter font to match the platform body typography
 */
export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#FF7F7F',       // Precision Coral
    colorBackground: '#ffffff',
    colorText: '#1B263B',          // Trust Navy
    colorDanger: '#df1b41',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '6px',
  },
};
