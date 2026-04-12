/**
 * Feature: nigms-app
 * Property 4: Newsletter email validation rejects non-emails
 *
 * Models the email validation logic used in both the newsletter API route
 * (app/api/newsletter/route.ts) and the NewsletterForm component
 * (components/NewsletterForm.tsx) as a pure function.
 *
 * Both locations use the same regex:
 *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *
 * The property: for any string that does NOT conform to a valid email format,
 * the validation function returns false (i.e., the form would display a
 * validation error and the API would return 400 without inserting a record).
 *
 * Conversely, for any string that IS a valid email, validation returns true.
 *
 * Validates: Requirements 2.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Email validation — mirrors the exact regex used in the real code
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(input: string): boolean {
  return EMAIL_REGEX.test(input);
}

// ---------------------------------------------------------------------------
// Model of the newsletter submission handler
//
// Returns the HTTP-equivalent response, mirroring the real API route logic:
//   - invalid email → { status: 400, inserted: false }
//   - valid email   → { status: 201, inserted: true }
// ---------------------------------------------------------------------------

interface SubmitResult {
  status: 400 | 201;
  inserted: boolean;
}

function submitNewsletter(db: Set<string>, email: string): SubmitResult {
  if (!isValidEmail(email)) {
    return { status: 400, inserted: false };
  }
  db.add(email);
  return { status: 201, inserted: true };
}

// ---------------------------------------------------------------------------
// Arbitraries for invalid email strings
// ---------------------------------------------------------------------------

/** Strings with no '@' character at all */
const noAtSignArb = fc.string().filter((s) => !s.includes('@'));

/** Strings with '@' but no '.' after it (no domain extension) */
const noTldArb = fc
  .tuple(
    fc.stringMatching(/^[^\s@]+$/), // local part
    fc.stringMatching(/^[^\s@.]+$/), // domain without dot
  )
  .map(([local, domain]) => `${local}@${domain}`);

/** Strings with '@' but nothing before it */
const emptyLocalPartArb = fc
  .stringMatching(/^[^\s@.]+\.[^\s@]+$/)
  .map((domain) => `@${domain}`);

/** Strings with '@' but nothing after it */
const emptyDomainArb = fc
  .stringMatching(/^[^\s@]+$/)
  .map((local) => `${local}@`);

/** Strings containing whitespace (spaces/tabs) — rejected by [^\s@]+ */
const withWhitespaceArb = fc
  .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
  .map(([a, b]) => `${a} ${b}`);

/** The empty string */
const emptyStringArb = fc.constant('');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 4: Newsletter email validation rejects non-emails', () => {
  it('strings with no @ sign are always rejected', () => {
    fc.assert(
      fc.property(noAtSignArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('strings with @ but no TLD (no dot in domain) are rejected', () => {
    fc.assert(
      fc.property(noTldArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('strings with nothing before @ are rejected', () => {
    fc.assert(
      fc.property(emptyLocalPartArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('strings with nothing after @ are rejected', () => {
    fc.assert(
      fc.property(emptyDomainArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('strings containing whitespace are rejected', () => {
    fc.assert(
      fc.property(withWhitespaceArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('the empty string is rejected', () => {
    fc.assert(
      fc.property(emptyStringArb, (input) => {
        expect(isValidEmail(input)).toBe(false);
      }),
      { numRuns: 20 },
    );
  });

  it('invalid emails never result in a database insert', () => {
    const invalidEmailArb = fc.oneof(
      noAtSignArb,
      emptyDomainArb,
      emptyStringArb,
    );

    fc.assert(
      fc.property(invalidEmailArb, (input) => {
        const db = new Set<string>();
        const result = submitNewsletter(db, input);

        expect(result.status).toBe(400);
        expect(result.inserted).toBe(false);
        expect(db.size).toBe(0);
      }),
      { numRuns: 20 },
    );
  });

  it('valid emails always pass validation', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });

  it('valid emails are accepted and inserted by the submission handler', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const db = new Set<string>();
        const result = submitNewsletter(db, email);

        expect(result.status).toBe(201);
        expect(result.inserted).toBe(true);
        expect(db.has(email)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });
});
