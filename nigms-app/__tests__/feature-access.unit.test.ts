/**
 * Unit tests for feature access helper functions.
 * Task 10.1 — Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { describe, it, expect } from 'vitest';
import { canAccessFeature, getLockedFeatures, type PremiumFeature } from '../lib/feature-access';

const ALL_FEATURES: PremiumFeature[] = [
  'Priority_Dispatch',
  'ROI_Tracker',
  'Emergency_Dispatch',
];

// ─── canAccessFeature ─────────────────────────────────────────────────────────

describe('canAccessFeature — no subscription (null / undefined)', () => {
  it('locks Priority_Dispatch when tier is null (Requirement 5.1)', () => {
    expect(canAccessFeature(null, 'Priority_Dispatch')).toBe(false);
  });

  it('locks ROI_Tracker when tier is null (Requirement 5.1)', () => {
    expect(canAccessFeature(null, 'ROI_Tracker')).toBe(false);
  });

  it('locks Emergency_Dispatch when tier is null (Requirement 5.1)', () => {
    expect(canAccessFeature(null, 'Emergency_Dispatch')).toBe(false);
  });

  it('locks all features when tier is undefined (Requirement 5.1)', () => {
    ALL_FEATURES.forEach((f) => {
      expect(canAccessFeature(undefined, f)).toBe(false);
    });
  });
});

describe('canAccessFeature — essential tier', () => {
  it('locks Priority_Dispatch on essential (Requirement 5.2)', () => {
    expect(canAccessFeature('essential', 'Priority_Dispatch')).toBe(false);
  });

  it('locks ROI_Tracker on essential (Requirement 5.2)', () => {
    expect(canAccessFeature('essential', 'ROI_Tracker')).toBe(false);
  });

  it('locks Emergency_Dispatch on essential (Requirement 5.2)', () => {
    expect(canAccessFeature('essential', 'Emergency_Dispatch')).toBe(false);
  });
});

describe('canAccessFeature — elevated tier', () => {
  it('unlocks Priority_Dispatch on elevated (Requirement 5.3)', () => {
    expect(canAccessFeature('elevated', 'Priority_Dispatch')).toBe(true);
  });

  it('locks ROI_Tracker on elevated (Requirement 5.3)', () => {
    expect(canAccessFeature('elevated', 'ROI_Tracker')).toBe(false);
  });

  it('locks Emergency_Dispatch on elevated (Requirement 5.3)', () => {
    expect(canAccessFeature('elevated', 'Emergency_Dispatch')).toBe(false);
  });
});

describe('canAccessFeature — elite tier', () => {
  it('unlocks Priority_Dispatch on elite (Requirement 5.5)', () => {
    expect(canAccessFeature('elite', 'Priority_Dispatch')).toBe(true);
  });

  it('unlocks ROI_Tracker on elite (Requirement 5.5)', () => {
    expect(canAccessFeature('elite', 'ROI_Tracker')).toBe(true);
  });

  it('unlocks Emergency_Dispatch on elite (Requirement 5.5)', () => {
    expect(canAccessFeature('elite', 'Emergency_Dispatch')).toBe(true);
  });
});

describe('canAccessFeature — vip tier', () => {
  it('unlocks Priority_Dispatch on vip (Requirement 5.5)', () => {
    expect(canAccessFeature('vip', 'Priority_Dispatch')).toBe(true);
  });

  it('unlocks ROI_Tracker on vip (Requirement 5.5)', () => {
    expect(canAccessFeature('vip', 'ROI_Tracker')).toBe(true);
  });

  it('unlocks Emergency_Dispatch on vip (Requirement 5.5)', () => {
    expect(canAccessFeature('vip', 'Emergency_Dispatch')).toBe(true);
  });
});

// ─── getLockedFeatures ────────────────────────────────────────────────────────

describe('getLockedFeatures', () => {
  it('returns all 3 features locked for null (no subscription) (Requirement 5.1)', () => {
    const locked = getLockedFeatures(null);
    expect(locked).toHaveLength(3);
    expect(locked).toContain('Priority_Dispatch');
    expect(locked).toContain('ROI_Tracker');
    expect(locked).toContain('Emergency_Dispatch');
  });

  it('returns all 3 features locked for essential (Requirement 5.2)', () => {
    const locked = getLockedFeatures('essential');
    expect(locked).toHaveLength(3);
    expect(locked).toContain('Priority_Dispatch');
    expect(locked).toContain('ROI_Tracker');
    expect(locked).toContain('Emergency_Dispatch');
  });

  it('returns ROI_Tracker and Emergency_Dispatch locked for elevated (Requirement 5.3)', () => {
    const locked = getLockedFeatures('elevated');
    expect(locked).toHaveLength(2);
    expect(locked).toContain('ROI_Tracker');
    expect(locked).toContain('Emergency_Dispatch');
    expect(locked).not.toContain('Priority_Dispatch');
  });

  it('returns empty array (no locked features) for elite (Requirement 5.5)', () => {
    expect(getLockedFeatures('elite')).toHaveLength(0);
  });

  it('returns empty array (no locked features) for vip (Requirement 5.5)', () => {
    expect(getLockedFeatures('vip')).toHaveLength(0);
  });

  it('returns all 3 features locked for unknown tier', () => {
    const locked = getLockedFeatures('unknown_tier');
    expect(locked).toHaveLength(3);
  });
});
