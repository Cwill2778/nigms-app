/**
 * Unit tests for subscription utility functions.
 * Task 8.1 — Requirements: 3.2, 3.3, 3.4, 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTierAllocation, getOverageRate, resetMonthlyAllocation } from '../lib/subscription-utils';

// ─── getTierAllocation ────────────────────────────────────────────────────────

describe('getTierAllocation', () => {
  it('returns 60 minutes for essential tier (Requirement 3.2)', () => {
    expect(getTierAllocation('essential')).toBe(60);
  });

  it('returns 120 minutes for elevated tier (Requirement 3.3)', () => {
    expect(getTierAllocation('elevated')).toBe(120);
  });

  it('returns 240 minutes for elite tier (Requirement 3.4)', () => {
    expect(getTierAllocation('elite')).toBe(240);
  });

  it('returns 240 minutes for vip tier (same as elite)', () => {
    expect(getTierAllocation('vip')).toBe(240);
  });

  it('returns 0 for unknown tier', () => {
    expect(getTierAllocation('unknown')).toBe(0);
    expect(getTierAllocation('')).toBe(0);
  });
});

// ─── getOverageRate ───────────────────────────────────────────────────────────

describe('getOverageRate', () => {
  it('returns 0.7238 for essential tier — 10% off base rate (Requirement 4.3)', () => {
    expect(getOverageRate('essential')).toBeCloseTo(0.7238, 4);
  });

  it('returns 0.6835 for elevated tier — 15% off base rate (Requirement 4.3)', () => {
    expect(getOverageRate('elevated')).toBeCloseTo(0.6835, 4);
  });

  it('returns 0.6434 for elite tier — 20% off base rate (Requirement 4.3)', () => {
    expect(getOverageRate('elite')).toBeCloseTo(0.6434, 4);
  });

  it('returns 0.6434 for vip tier — same discount as elite (Requirement 4.3)', () => {
    expect(getOverageRate('vip')).toBeCloseTo(0.6434, 4);
  });

  it('returns base rate 0.8042 for unknown tier', () => {
    expect(getOverageRate('unknown')).toBeCloseTo(0.8042, 4);
    expect(getOverageRate('')).toBeCloseTo(0.8042, 4);
  });

  it('essential rate is less than base rate (discount applied)', () => {
    expect(getOverageRate('essential')).toBeLessThan(0.8042);
  });

  it('elevated rate is less than essential rate (higher discount)', () => {
    expect(getOverageRate('elevated')).toBeLessThan(getOverageRate('essential'));
  });

  it('elite rate is less than elevated rate (highest discount)', () => {
    expect(getOverageRate('elite')).toBeLessThan(getOverageRate('elevated'));
  });
});

// ─── resetMonthlyAllocation ───────────────────────────────────────────────────

// Mock @supabase/supabase-js so we don't need a real DB connection
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('resetMonthlyAllocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain: from → update → eq → resolves with no error
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  it('calls supabase update with minutes_used=0 for the given subscription ID', async () => {
    await resetMonthlyAllocation('sub-abc-123');

    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ minutes_used: 0 })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'sub-abc-123');
  });

  it('resolves without throwing when update succeeds', async () => {
    await expect(resetMonthlyAllocation('sub-abc-123')).resolves.toBeUndefined();
  });

  it('throws an error when the supabase update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB error' } });

    await expect(resetMonthlyAllocation('sub-abc-123')).rejects.toThrow(
      'resetMonthlyAllocation failed for sub-abc-123: DB error'
    );
  });
});
