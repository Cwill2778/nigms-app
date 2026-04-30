'use client';

/**
 * FeatureGate — wraps premium dashboard sections.
 *
 * If the client's tier grants access to the feature, children are rendered
 * normally. Otherwise, children are rendered in a grayed-out, non-interactive
 * state with an absolute overlay containing:
 *   - Trust Navy lock icon (SVG)
 *   - Feature display name
 *   - "Upgrade to unlock" label
 *   - Precision Coral CTA button linking to the upgrade flow
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import Link from 'next/link';
import { canAccessFeature, type PremiumFeature } from '@/lib/feature-access';

const featureLabels: Record<PremiumFeature, string> = {
  Priority_Dispatch: 'Priority Dispatch',
  ROI_Tracker: 'ROI Tracker',
  Emergency_Dispatch: 'Emergency Dispatch',
};

/**
 * Derive the upgrade URL based on the current tier and the feature being gated.
 *
 * Logic:
 *   - Priority_Dispatch is unlocked at 'elevated', so essential/none → upgrade to elevated
 *   - ROI_Tracker and Emergency_Dispatch are unlocked at 'elite', so elevated/essential/none → upgrade to elite
 *   - If already at elite (shouldn't reach here), fall back to /assurance
 */
function defaultUpgradeHref(
  tier: string | null | undefined,
  feature: PremiumFeature,
): string {
  if (feature === 'Priority_Dispatch') {
    // Needs elevated or above
    return '/assurance?upgrade=elevated';
  }
  // ROI_Tracker and Emergency_Dispatch need elite or above
  if (tier === 'elevated') {
    return '/assurance?upgrade=elite';
  }
  // No subscription or essential → subscription pitch page
  return '/assurance';
}

interface FeatureGateProps {
  /** The client's current subscription tier (null/undefined = no subscription). */
  tier: string | null | undefined;
  /** The premium feature to gate. */
  feature: PremiumFeature;
  /** Content to render when access is granted. */
  children: React.ReactNode;
  /** Override the upgrade CTA href. Defaults to a tier-appropriate upgrade URL. */
  upgradeHref?: string;
}

export default function FeatureGate({
  tier,
  feature,
  children,
  upgradeHref,
}: FeatureGateProps) {
  const hasAccess = canAccessFeature(tier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const href = upgradeHref ?? defaultUpgradeHref(tier, feature);
  const label = featureLabels[feature];

  return (
    <div className="relative">
      {/* Grayed-out, non-interactive content */}
      <div
        aria-hidden="true"
        style={{ opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded"
        style={{
          background: 'rgba(27, 38, 59, 0.82)', // trust-navy with opacity
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* Trust Navy lock icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B263B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            color: '#1B263B',
            background: '#D4DCEE',
            borderRadius: '50%',
            padding: '6px',
            width: '44px',
            height: '44px',
          }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>

        {/* Feature name */}
        <p
          style={{
            fontFamily: 'var(--font-heading), Montserrat, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#D4DCEE',
            margin: 0,
          }}
        >
          {label}
        </p>

        {/* Upgrade label */}
        <p
          style={{
            fontSize: '0.8rem',
            color: '#C4BFB8',
            margin: 0,
          }}
        >
          Upgrade to unlock
        </p>

        {/* Precision Coral CTA button */}
        <Link
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1.25rem',
            background: '#FF7F7F',
            color: '#1B263B',
            fontFamily: 'var(--font-heading), Montserrat, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: '2px',
            textDecoration: 'none',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#ff6666';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FF7F7F';
          }}
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
