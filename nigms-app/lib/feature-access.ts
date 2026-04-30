/**
 * Feature Access — tier/feature gating logic
 *
 * Feature matrix (Requirements 5.1–5.5):
 *
 *   Feature            | none | essential | elevated | elite | vip
 *   -------------------|------|-----------|----------|-------|----
 *   Priority_Dispatch  |  ✗   |     ✗     |    ✓     |   ✓   |  ✓
 *   ROI_Tracker        |  ✗   |     ✗     |    ✗     |   ✓   |  ✓
 *   Emergency_Dispatch |  ✗   |     ✗     |    ✗     |   ✓   |  ✓
 */

export type PremiumFeature = 'Priority_Dispatch' | 'ROI_Tracker' | 'Emergency_Dispatch';

const ALL_FEATURES: PremiumFeature[] = [
  'Priority_Dispatch',
  'ROI_Tracker',
  'Emergency_Dispatch',
];

/**
 * Returns true if the given subscription tier grants access to the feature.
 *
 * - null / undefined / unknown tier → no subscription → all features locked
 * - 'essential'  → all three features locked
 * - 'elevated'   → Priority_Dispatch unlocked; ROI_Tracker + Emergency_Dispatch locked
 * - 'elite'      → all features unlocked
 * - 'vip'        → all features unlocked (same as elite)
 */
export function canAccessFeature(
  tier: string | null | undefined,
  feature: PremiumFeature,
): boolean {
  switch (tier) {
    case 'elevated':
      return feature === 'Priority_Dispatch';
    case 'elite':
    case 'vip':
      return true;
    // 'essential', null, undefined, or any unknown value → locked
    default:
      return false;
  }
}

/**
 * Returns the list of features that are locked for the given tier.
 * An empty array means all features are accessible.
 */
export function getLockedFeatures(
  tier: string | null | undefined,
): PremiumFeature[] {
  return ALL_FEATURES.filter((f) => !canAccessFeature(tier, f));
}
