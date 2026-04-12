import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { calculateDeposit } from '../../lib/booking';

/**
 * Property 5: Deposit calculation is always 15%
 * Validates: Requirements 3.4
 */
describe('Property 5: Deposit calculation is always 15%', () => {
  it('should equal Math.round(amount * 0.15 * 100) / 100 for any positive amount', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        (amount) => {
          const expected = Math.round(amount * 0.15 * 100) / 100;
          return calculateDeposit(amount) === expected;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always return a non-negative value for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        (amount) => calculateDeposit(amount) >= 0
      ),
      { numRuns: 20 }
    );
  });

  it('should never exceed the full amount for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        (amount) => calculateDeposit(amount) <= amount
      ),
      { numRuns: 20 }
    );
  });
});
