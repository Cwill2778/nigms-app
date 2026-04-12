/**
 * Feature: nigms-app
 * Property 3: Newsletter deduplication
 *
 * Models the newsletter subscription API handler as a pure function backed
 * by a Set<string> representing the `newsletter_subscribers` table's unique
 * email constraint.
 *
 * The real handler (app/api/newsletter/route.ts) inserts into Supabase and
 * relies on the UNIQUE constraint on `email` (error code "23505") to detect
 * duplicates. This model captures that contract without any network dependency.
 *
 * subscribeEmail(db, email):
 *   - If email is NOT in db → insert it, return { status: 201, message: 'Subscribed successfully' }
 *   - If email IS already in db → do NOT insert, return { status: 200, message: 'Already subscribed' }
 *
 * For any valid email address:
 *   - Submitting twice results in exactly 1 record in the store
 *   - The second submission returns an informational (non-error) response
 *   - The subscriber count never exceeds 1 for the same email
 *
 * For any two distinct valid email addresses:
 *   - Each gets its own independent record
 *
 * Validates: Requirements 2.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscribeResult {
  status: 200 | 201 | 400 | 500;
  message: string;
}

// ---------------------------------------------------------------------------
// Pure model of the newsletter subscription handler
//
// `db` is a Set<string> representing the unique-email-constrained table.
// The function mutates `db` in place (mirroring a real DB insert) and
// returns the HTTP-equivalent response.
// ---------------------------------------------------------------------------

function subscribeEmail(db: Set<string>, email: string): SubscribeResult {
  if (db.has(email)) {
    // Duplicate — mirrors the 23505 unique constraint branch
    return { status: 200, message: 'Already subscribed' };
  }
  db.add(email);
  return { status: 201, message: 'Subscribed successfully' };
}

// ---------------------------------------------------------------------------
// Arbitraries
//
// fast-check's built-in emailAddress() generates RFC-compliant addresses,
// matching the EMAIL_REGEX used in the real handler.
// ---------------------------------------------------------------------------

const validEmailArb: fc.Arbitrary<string> = fc.emailAddress();

// Two *distinct* valid email addresses
const twoDifferentEmailsArb: fc.Arbitrary<[string, string]> = fc
  .tuple(validEmailArb, validEmailArb)
  .filter(([a, b]) => a !== b);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 3: Newsletter deduplication', () => {
  it('submitting the same email twice results in exactly 1 record', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const db = new Set<string>();

        subscribeEmail(db, email);
        subscribeEmail(db, email);

        expect(db.size).toBe(1);
        expect(db.has(email)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });

  it('the second submission returns an informational (non-error) response', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const db = new Set<string>();

        const first = subscribeEmail(db, email);
        const second = subscribeEmail(db, email);

        // First submission is a success
        expect(first.status).toBe(201);

        // Second submission is informational — not an error (4xx/5xx)
        expect(second.status).toBe(200);
        expect(second.message).toBe('Already subscribed');
      }),
      { numRuns: 20 },
    );
  });

  it('subscriber count never exceeds 1 for the same email regardless of submission count', () => {
    fc.assert(
      fc.property(validEmailArb, fc.integer({ min: 2, max: 10 }), (email, times) => {
        const db = new Set<string>();

        for (let i = 0; i < times; i++) {
          subscribeEmail(db, email);
        }

        expect(db.size).toBe(1);
      }),
      { numRuns: 20 },
    );
  });

  it('different emails each get their own independent record', () => {
    fc.assert(
      fc.property(twoDifferentEmailsArb, ([emailA, emailB]) => {
        const db = new Set<string>();

        const resultA = subscribeEmail(db, emailA);
        const resultB = subscribeEmail(db, emailB);

        // Both are new subscriptions
        expect(resultA.status).toBe(201);
        expect(resultB.status).toBe(201);

        // Both are stored
        expect(db.size).toBe(2);
        expect(db.has(emailA)).toBe(true);
        expect(db.has(emailB)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });

  it('first submission of a new email always succeeds', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const db = new Set<string>();
        const result = subscribeEmail(db, email);

        expect(result.status).toBe(201);
        expect(result.message).toBe('Subscribed successfully');
        expect(db.has(email)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });
});
