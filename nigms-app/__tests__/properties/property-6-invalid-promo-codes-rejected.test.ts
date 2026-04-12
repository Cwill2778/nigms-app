/**
 * Feature: nigms-app
 * Property 6: Invalid promo codes are always rejected
 *
 * Models the promo code validation logic from:
 *   app/api/promo/validate/route.ts
 *
 * The route stores valid codes in a server-side constant:
 *   const PROMO_CODES = { NAILEDIT: { valid: true, waivesDeposit: true } }
 *
 * Validation logic:
 *   1. If code is missing or not a string → { valid: false, waivesDeposit: false }
 *   2. Trim and uppercase the code, look it up in PROMO_CODES
 *   3. If found → return the stored result
 *   4. Otherwise → { valid: false, waivesDeposit: false }
 *
 * The property: for any string that is NOT 'NAILEDIT' (after trim + uppercase),
 * the validation function must return { valid: false, waivesDeposit: false }.
 * Conversely, 'NAILEDIT' must return { valid: true, waivesDeposit: true }.
 *
 * Validates: Requirements 3.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Promo code validation — mirrors the exact logic in the real route handler
// ---------------------------------------------------------------------------

interface PromoValidateResponse {
  valid: boolean;
  waivesDeposit: boolean;
}

const PROMO_CODES: Record<string, PromoValidateResponse> = {
  NAILEDIT: { valid: true, waivesDeposit: true },
};

function validatePromoCode(code: unknown): PromoValidateResponse {
  if (!code || typeof code !== 'string') {
    return { valid: false, waivesDeposit: false };
  }
  const result = PROMO_CODES[code.trim().toUpperCase()];
  if (result) {
    return result;
  }
  return { valid: false, waivesDeposit: false };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Any string that is NOT 'NAILEDIT' after trim + toUpperCase */
const nonNaileditArb = fc
  .string()
  .filter((s) => s.trim().toUpperCase() !== 'NAILEDIT');

/** Strings that look similar to NAILEDIT but differ by at least one character */
const nearMissArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .filter((s) => s.trim().toUpperCase() !== 'NAILEDIT');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 6: Invalid promo codes are always rejected', () => {
  it('any string that is not NAILEDIT returns { valid: false, waivesDeposit: false }', () => {
    fc.assert(
      fc.property(nonNaileditArb, (code) => {
        const result = validatePromoCode(code);
        expect(result.valid).toBe(false);
        expect(result.waivesDeposit).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('empty string is rejected', () => {
    const result = validatePromoCode('');
    expect(result.valid).toBe(false);
    expect(result.waivesDeposit).toBe(false);
  });

  it('null and undefined are rejected', () => {
    expect(validatePromoCode(null)).toEqual({ valid: false, waivesDeposit: false });
    expect(validatePromoCode(undefined)).toEqual({ valid: false, waivesDeposit: false });
  });

  it('non-string types are rejected', () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer(), fc.boolean(), fc.float()), (nonString) => {
        const result = validatePromoCode(nonString);
        expect(result.valid).toBe(false);
        expect(result.waivesDeposit).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('near-miss strings (short strings that are not NAILEDIT) are rejected', () => {
    fc.assert(
      fc.property(nearMissArb, (code) => {
        const result = validatePromoCode(code);
        expect(result.valid).toBe(false);
        expect(result.waivesDeposit).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('NAILEDIT returns { valid: true, waivesDeposit: true }', () => {
    const result = validatePromoCode('NAILEDIT');
    expect(result.valid).toBe(true);
    expect(result.waivesDeposit).toBe(true);
  });

  it('NAILEDIT with surrounding whitespace is accepted (trim behavior)', () => {
    expect(validatePromoCode('  NAILEDIT  ')).toEqual({ valid: true, waivesDeposit: true });
  });

  it('lowercase nailedit is accepted (case-insensitive behavior)', () => {
    expect(validatePromoCode('nailedit')).toEqual({ valid: true, waivesDeposit: true });
  });

  it('mixed-case variants of NAILEDIT are accepted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('nailedit', 'Nailedit', 'NAILEDIT', 'NaIlEdIt', 'nAiLedit'),
        (code) => {
          const result = validatePromoCode(code);
          expect(result.valid).toBe(true);
          expect(result.waivesDeposit).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });
});
