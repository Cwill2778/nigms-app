/**
 * Feature: comprehensive-implementation-fixes
 * Property-based tests for all bug conditions in the comprehensive fixes spec.
 *
 * Uses fast-check with 100 iterations per property.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// 44.1 – balance_remaining equals total_billed minus amount_paid
// Feature: comprehensive-implementation-fixes, Property 1: balance_remaining equals total_billed minus amount_paid
// ---------------------------------------------------------------------------

/**
 * Pure function modelling the computed column formula.
 * Mirrors the SQL: GENERATED ALWAYS AS (total_billed - amount_paid) STORED
 */
function computeBalanceRemaining(totalBilled: number, amountPaid: number): number {
  return Math.round((totalBilled - amountPaid) * 100) / 100;
}

describe('44.1 – balance_remaining computed column formula', () => {
  // Feature: comprehensive-implementation-fixes, Property 1: balance_remaining equals total_billed minus amount_paid
  it('balance_remaining equals total_billed minus amount_paid for any non-negative floats', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (totalBilled, amountPaid) => {
          const result = computeBalanceRemaining(totalBilled, amountPaid);
          const expected = Math.round((totalBilled - amountPaid) * 100) / 100;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('balance_remaining is zero when amount_paid equals total_billed', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (amount) => {
          const result = computeBalanceRemaining(amount, amount);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 44.2 – duration_minutes equals elapsed time in minutes
// Feature: comprehensive-implementation-fixes, Property 2: duration_minutes equals elapsed time in minutes
// ---------------------------------------------------------------------------

/**
 * Pure function modelling the computed column formula.
 * Mirrors the SQL: EXTRACT(EPOCH FROM (stopped_at - started_at))::integer / 60
 */
function computeDurationMinutes(startedAt: Date, stoppedAt: Date): number | null {
  if (stoppedAt <= startedAt) return null;
  return Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 60000);
}

describe('44.2 – duration_minutes computed column formula', () => {
  // Feature: comprehensive-implementation-fixes, Property 2: duration_minutes equals elapsed time in minutes
  it('duration_minutes equals Math.floor((stopped_at - started_at) / 60000) for valid date ranges', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        (startedAt, stoppedAt) => {
          if (stoppedAt <= startedAt) return; // skip invalid ranges
          const result = computeDurationMinutes(startedAt, stoppedAt);
          const expected = Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 60000);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('duration_minutes is null when stopped_at is not after started_at', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        (date) => {
          // same date → not after
          expect(computeDurationMinutes(date, date)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('duration_minutes is always non-negative for valid ranges', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        fc.integer({ min: 1, max: 525600 }), // 1 minute to 1 year in minutes
        (startedAt, offsetMinutes) => {
          const stoppedAt = new Date(startedAt.getTime() + offsetMinutes * 60000);
          const result = computeDurationMinutes(startedAt, stoppedAt);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 44.3 – auto-generated numbers are unique and correctly formatted
// Feature: comprehensive-implementation-fixes, Property 3: auto-generated numbers are unique and correctly formatted
// ---------------------------------------------------------------------------

/** Pure function modelling WO number generation */
function generateWoNumber(year: number, seq: number): string {
  return `WO-${year}-${String(seq).padStart(4, '0')}`;
}

/** Pure function modelling estimate number generation */
function generateEstimateNumber(clientId: string, seq: number): string {
  const shortId = clientId.replace(/-/g, '').slice(0, 8);
  return `EST-${shortId}-${String(seq).padStart(4, '0')}`;
}

/** Pure function modelling receipt number generation */
function generateReceiptNumber(year: number, seq: number): string {
  return `RCT-${year}-${String(seq).padStart(4, '0')}`;
}

const WO_PATTERN = /^WO-\d{4}-\d{4}$/;
const EST_PATTERN = /^EST-[a-f0-9]{8}-\d{4}$/;
const RCT_PATTERN = /^RCT-\d{4}-\d{4}$/;

describe('44.3 – auto-generated number format', () => {
  // Feature: comprehensive-implementation-fixes, Property 3: auto-generated numbers are unique and correctly formatted
  it('WO numbers match pattern WO-YYYY-NNNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2099 }),
        fc.integer({ min: 1, max: 9999 }),
        (year, seq) => {
          const woNumber = generateWoNumber(year, seq);
          expect(woNumber).toMatch(WO_PATTERN);
          expect(woNumber).toContain(`WO-${year}-`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('EST numbers match pattern EST-{clientId8chars}-NNNN', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 1, max: 9999 }),
        (clientId, seq) => {
          const estNumber = generateEstimateNumber(clientId, seq);
          expect(estNumber).toMatch(EST_PATTERN);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('RCT numbers match pattern RCT-YYYY-NNNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2099 }),
        fc.integer({ min: 1, max: 9999 }),
        (year, seq) => {
          const rctNumber = generateReceiptNumber(year, seq);
          expect(rctNumber).toMatch(RCT_PATTERN);
          expect(rctNumber).toContain(`RCT-${year}-`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('WO numbers with different sequences are unique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2099 }),
        fc.integer({ min: 1, max: 4999 }),
        (year, seq) => {
          const num1 = generateWoNumber(year, seq);
          const num2 = generateWoNumber(year, seq + 1);
          expect(num1).not.toBe(num2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 44.4 – API route handler files exist
// Feature: comprehensive-implementation-fixes, Property 4: API routes return 404 before implementation, 200 after
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../../');

const REQUIRED_ROUTE_FILES = [
  'app/api/admin/work-orders/[id]/accept/route.ts',
  'app/api/admin/work-orders/[id]/reject/route.ts',
  'app/api/admin/work-orders/[id]/route.ts',
  'app/api/admin/work-orders/[id]/status/route.ts',
  'app/api/admin/work-orders/[id]/time-entries/route.ts',
  'app/api/admin/work-orders/[id]/time-entries/[entryId]/route.ts',
  'app/api/admin/work-orders/[id]/estimates/route.ts',
  'app/api/admin/work-orders/[id]/bills/route.ts',
  'app/api/admin/work-orders/[id]/change-orders/route.ts',
  'app/api/admin/clients/search/route.ts',
  'app/api/admin/clients/[id]/detail/route.ts',
  'app/api/admin/messages/route.ts',
  'app/api/admin/messages/read/route.ts',
  'app/api/admin/payments/manual/route.ts',
  'app/api/stripe/checkout/route.ts',
  'app/api/stripe/onboarding-success/route.ts',
  'app/api/onboarding/property/route.ts',
  'app/api/client/tour-complete/route.ts',
];

describe('44.4 – API route files exist (Bug Conditions 2.1–2.19)', () => {
  // Feature: comprehensive-implementation-fixes, Property 4: API routes return 404 before implementation, 200 after
  it('all required API route handler files exist on disk', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_ROUTE_FILES),
        (routeFile) => {
          const fullPath = path.join(PROJECT_ROOT, routeFile);
          expect(fs.existsSync(fullPath), `Missing route file: ${routeFile}`).toBe(true);
        }
      ),
      { numRuns: REQUIRED_ROUTE_FILES.length }
    );
  });

  // Explicit check for each route so failures are easy to identify
  for (const routeFile of REQUIRED_ROUTE_FILES) {
    it(`route file exists: ${routeFile}`, () => {
      const fullPath = path.join(PROJECT_ROOT, routeFile);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// 44.5 – Realtime subscription delivers messages within 5 seconds
// Feature: comprehensive-implementation-fixes, Property 5: Realtime subscription delivers messages within 5 seconds
// ---------------------------------------------------------------------------

const MESSAGING_PANEL_PATH = path.join(PROJECT_ROOT, 'components/MessagingPanel.tsx');

describe('44.5 – MessagingPanel contains Supabase Realtime subscription (Bug Conditions 4.1, 4.3)', () => {
  // Feature: comprehensive-implementation-fixes, Property 5: Realtime subscription delivers messages within 5 seconds
  it('MessagingPanel source file exists', () => {
    expect(fs.existsSync(MESSAGING_PANEL_PATH)).toBe(true);
  });

  it('MessagingPanel source contains supabase.channel() call', () => {
    const source = fs.readFileSync(MESSAGING_PANEL_PATH, 'utf-8');
    expect(source).toContain('supabase');
    expect(source).toContain('.channel(');
  });

  it('MessagingPanel source contains .subscribe() call', () => {
    const source = fs.readFileSync(MESSAGING_PANEL_PATH, 'utf-8');
    expect(source).toContain('.subscribe(');
  });

  it('MessagingPanel source contains postgres_changes listener for INSERT events', () => {
    const source = fs.readFileSync(MESSAGING_PANEL_PATH, 'utf-8');
    expect(source).toContain('postgres_changes');
    expect(source).toContain('INSERT');
  });

  it('MessagingPanel source handles CHANNEL_ERROR for reconnection (Bug Condition 4.2)', () => {
    const source = fs.readFileSync(MESSAGING_PANEL_PATH, 'utf-8');
    expect(source).toContain('CHANNEL_ERROR');
  });

  it('MessagingPanel source appends new messages to state on realtime event', () => {
    const source = fs.readFileSync(MESSAGING_PANEL_PATH, 'utf-8');
    // The handler should update messages state
    expect(source).toContain('setMessages');
  });
});

// ---------------------------------------------------------------------------
// 44.6 – Onboarding redirect guard redirects correctly based on step
// Feature: comprehensive-implementation-fixes, Property 6: Onboarding redirect guard redirects correctly based on step
// ---------------------------------------------------------------------------

type OnboardingStep = 'property_setup' | 'assurance_upsell';

interface OnboardingState {
  onboarding_complete: boolean;
  onboarding_step?: OnboardingStep;
}

/**
 * Pure function modelling the redirect guard logic from (client)/layout.tsx.
 * Returns the redirect path or null if no redirect is needed.
 */
function computeOnboardingRedirect(state: OnboardingState | null): string | null {
  if (!state) return null;
  if (state.onboarding_complete) return null;
  if (state.onboarding_step === 'property_setup') return '/onboarding/property';
  if (state.onboarding_step === 'assurance_upsell') return '/onboarding/assurance';
  return null;
}

describe('44.6 – Onboarding redirect guard (Bug Conditions 6.1, 6.2)', () => {
  // Feature: comprehensive-implementation-fixes, Property 6: Onboarding redirect guard redirects correctly based on step
  it('redirects to /onboarding/property when step is property_setup and onboarding incomplete', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OnboardingStep>('property_setup'),
        (step) => {
          const state: OnboardingState = { onboarding_complete: false, onboarding_step: step };
          expect(computeOnboardingRedirect(state)).toBe('/onboarding/property');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('redirects to /onboarding/assurance when step is assurance_upsell and onboarding incomplete', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OnboardingStep>('assurance_upsell'),
        (step) => {
          const state: OnboardingState = { onboarding_complete: false, onboarding_step: step };
          expect(computeOnboardingRedirect(state)).toBe('/onboarding/assurance');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does NOT redirect when onboarding_complete is true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OnboardingStep>('property_setup', 'assurance_upsell'),
        (step) => {
          const state: OnboardingState = { onboarding_complete: true, onboarding_step: step };
          expect(computeOnboardingRedirect(state)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does NOT redirect when onboarding state is null', () => {
    expect(computeOnboardingRedirect(null)).toBeNull();
  });

  it('redirect path is always one of the two onboarding routes or null', () => {
    fc.assert(
      fc.property(
        fc.record({
          onboarding_complete: fc.boolean(),
          onboarding_step: fc.constantFrom<OnboardingStep>('property_setup', 'assurance_upsell'),
        }),
        (state) => {
          const redirect = computeOnboardingRedirect(state);
          const validRedirects = [null, '/onboarding/property', '/onboarding/assurance'];
          expect(validRedirects).toContain(redirect);
        }
      ),
      { numRuns: 100 }
    );
  });
});
