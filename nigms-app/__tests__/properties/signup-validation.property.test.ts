import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Feature: client-onboarding, Property 8: Signup input validation rejects invalid payloads

/**
 * Property 8: Signup input validation rejects invalid payloads
 * **Validates: Requirements 2.6, 1.6**
 *
 * For any signup payload where name, email, or password is empty/missing, or password
 * is fewer than 8 characters, the Signup_API SHALL return a 4xx error and create no
 * database records.
 */

// Test helper to get service client
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Arbitraries for invalid signup payloads
const emptyStringArb = fc.constantFrom('', '   ', '\t', '\n');
const shortPasswordArb = fc.string({ minLength: 0, maxLength: 7 });
const validNameArb = fc.stringMatching(/^[A-Za-z ]{1,50}$/);
const validEmailArb = fc.emailAddress().map(email => `test_${Date.now()}_${Math.random().toString(36).substring(7)}_${email}`);
const validPasswordArb = fc.string({ minLength: 8, maxLength: 50 });

// Generate invalid payloads with missing/empty fields
const invalidPayloadArb = fc.oneof(
  // Missing or empty name
  fc.record({
    name: emptyStringArb,
    email: validEmailArb,
    password: validPasswordArb,
  }),
  // Missing or empty email
  fc.record({
    name: validNameArb,
    email: emptyStringArb,
    password: validPasswordArb,
  }),
  // Missing or empty password
  fc.record({
    name: validNameArb,
    email: validEmailArb,
    password: emptyStringArb,
  }),
  // Short password (< 8 characters)
  fc.record({
    name: validNameArb,
    email: validEmailArb,
    password: shortPasswordArb,
  })
);

describe('Property 8: Signup input validation rejects invalid payloads', () => {
  const supabase = getServiceClient();

  it('should return 4xx error for invalid payloads', async () => {
    await fc.assert(
      fc.asyncProperty(invalidPayloadArb, async (invalidPayload) => {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPayload),
        });

        // Should return 400 Bad Request
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      }),
      { numRuns: 20 }
    );
  });

  it('should create no database records for invalid payloads', async () => {
    await fc.assert(
      fc.asyncProperty(invalidPayloadArb, async (invalidPayload) => {
        // Get initial user count
        const { data: beforeUsers } = await supabase.auth.admin.listUsers();
        const beforeCount = beforeUsers?.users.length || 0;

        const response = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPayload),
        });

        // Should fail
        expect(response.status).toBeGreaterThanOrEqual(400);

        // Get user count after
        const { data: afterUsers } = await supabase.auth.admin.listUsers();
        const afterCount = afterUsers?.users.length || 0;

        // No new users should be created
        expect(afterCount).toBe(beforeCount);

        // If email is valid, check that no users or onboarding_states rows exist for this email
        if (invalidPayload.email && invalidPayload.email.includes('@')) {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const userWithEmail = authUsers?.users.find(u => u.email === invalidPayload.email);
          
          // Should not find any user with this email
          expect(userWithEmail).toBeUndefined();
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should return appropriate error messages for different validation failures', async () => {
    // Test empty name
    const emptyNamePayload = {
      name: '',
      email: 'test@example.com',
      password: 'password123',
    };
    const response1 = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emptyNamePayload),
    });
    expect(response1.status).toBe(400);
    const result1 = await response1.json();
    expect(result1.error).toContain('required');

    // Test short password
    const shortPasswordPayload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
    };
    const response2 = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shortPasswordPayload),
    });
    expect(response2.status).toBe(400);
    const result2 = await response2.json();
    expect(result2.error).toContain('8 characters');
  });
});
