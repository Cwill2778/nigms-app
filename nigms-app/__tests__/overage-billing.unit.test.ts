/**
 * Unit tests for overage billing utility functions.
 * Task 12.1 — Requirements: 4.3
 *
 * Tests:
 *   - No overage when minutes_used <= allocation
 *   - Correct overage minutes when usage exceeds allocation
 *   - Correct per-tier discounted rate applied to overage charge
 */

import { describe, it, expect } from 'vitest';
import { calculateOverage } from '../lib/overage-billing';

// ─── calculateOverage ─────────────────────────────────────────────────────────

describe('calculateOverage — Validates: Requirements 4.3', () => {
  // ── No overage cases ──────────────────────────────────────────────────────

  it('returns 0 overage minutes when minutes_used equals allocation', () => {
    const result = calculateOverage(60, 60, 'essential');
    expect(result.overageMinutes).toBe(0);
    expect(result.chargeAmount).toBe(0);
  });

  it('returns 0 overage minutes when minutes_used is less than allocation', () => {
    const result = calculateOverage(45, 60, 'essential');
    expect(result.overageMinutes).toBe(0);
    expect(result.chargeAmount).toBe(0);
  });

  it('returns 0 overage when minutes_used is 0', () => {
    const result = calculateOverage(0, 120, 'elevated');
    expect(result.overageMinutes).toBe(0);
    expect(result.chargeAmount).toBe(0);
  });

  // ── Correct overage minutes ───────────────────────────────────────────────

  it('returns correct overage minutes when usage exceeds allocation by 10', () => {
    const result = calculateOverage(70, 60, 'essential');
    expect(result.overageMinutes).toBe(10);
  });

  it('returns correct overage minutes when usage exceeds allocation by 1', () => {
    const result = calculateOverage(121, 120, 'elevated');
    expect(result.overageMinutes).toBe(1);
  });

  it('returns correct overage minutes for elite tier exceeding 240 allocation', () => {
    const result = calculateOverage(300, 240, 'elite');
    expect(result.overageMinutes).toBe(60);
  });

  it('returns correct overage minutes for vip tier (same allocation as elite)', () => {
    const result = calculateOverage(260, 240, 'vip');
    expect(result.overageMinutes).toBe(20);
  });

  // ── Correct per-tier discounted rate ─────────────────────────────────────

  it('applies essential tier rate ($0.7238/min) to overage charge', () => {
    // 10 overage minutes × $0.7238/min = $7.238
    const result = calculateOverage(70, 60, 'essential');
    expect(result.overageMinutes).toBe(10);
    expect(result.chargeAmount).toBeCloseTo(7.238, 3);
  });

  it('applies elevated tier rate ($0.6835/min) to overage charge', () => {
    // 20 overage minutes × $0.6835/min = $13.67
    const result = calculateOverage(140, 120, 'elevated');
    expect(result.overageMinutes).toBe(20);
    expect(result.chargeAmount).toBeCloseTo(13.67, 2);
  });

  it('applies elite tier rate ($0.6434/min) to overage charge', () => {
    // 30 overage minutes × $0.6434/min = $19.302
    const result = calculateOverage(270, 240, 'elite');
    expect(result.overageMinutes).toBe(30);
    expect(result.chargeAmount).toBeCloseTo(19.302, 3);
  });

  it('applies vip tier rate ($0.6434/min) — same as elite', () => {
    // 30 overage minutes × $0.6434/min = $19.302
    const result = calculateOverage(270, 240, 'vip');
    expect(result.overageMinutes).toBe(30);
    expect(result.chargeAmount).toBeCloseTo(19.302, 3);
  });

  it('applies base rate ($0.8042/min) for unknown tier', () => {
    // 10 overage minutes × $0.8042/min = $8.042
    const result = calculateOverage(70, 60, 'unknown');
    expect(result.overageMinutes).toBe(10);
    expect(result.chargeAmount).toBeCloseTo(8.042, 3);
  });

  // ── Elite rate is lower than essential rate (higher discount) ────────────

  it('elite tier charge is lower than essential tier charge for same overage minutes', () => {
    const essential = calculateOverage(70, 60, 'essential');
    const elite = calculateOverage(70, 60, 'elite');
    expect(elite.chargeAmount).toBeLessThan(essential.chargeAmount);
  });

  it('elevated tier charge is lower than essential tier charge for same overage minutes', () => {
    const essential = calculateOverage(70, 60, 'essential');
    const elevated = calculateOverage(70, 60, 'elevated');
    expect(elevated.chargeAmount).toBeLessThan(essential.chargeAmount);
  });
});
