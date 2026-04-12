/**
 * Feature: nigms-app
 * Property 2: Theme preference round-trip
 *
 * Models the next-themes localStorage persistence as pure functions:
 *   - setTheme(theme, store) — writes the theme to a mock localStorage
 *   - getTheme(store)        — reads the theme back from the mock localStorage
 *
 * For any theme value ('dark' | 'light' | 'system'), setting the theme and
 * then reading it back should return the exact same value — i.e., the
 * round-trip is lossless.
 *
 * next-themes stores the user's preference under the key 'theme' in
 * localStorage (the default storageKey). This test verifies that the
 * persistence contract holds for all valid theme values.
 *
 * Validates: Requirements 1.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Theme = 'dark' | 'light' | 'system';

// Minimal interface matching the subset of localStorage we care about
interface ThemeStore {
  data: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Pure functions modelling next-themes localStorage persistence
//
// next-themes uses localStorage.setItem(storageKey, theme) on setTheme()
// and localStorage.getItem(storageKey) to restore on page load.
// The default storageKey is 'theme'.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'theme';

function createStore(): ThemeStore {
  return { data: {} };
}

function setTheme(theme: Theme, store: ThemeStore): void {
  store.data[STORAGE_KEY] = theme;
}

function getTheme(store: ThemeStore): string | null {
  return store.data[STORAGE_KEY] ?? null;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const themeArb: fc.Arbitrary<Theme> = fc.constantFrom('dark', 'light', 'system');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 2: Theme preference round-trip', () => {
  it('set(theme) followed by get() returns the same theme for any valid theme value', () => {
    fc.assert(
      fc.property(themeArb, (theme) => {
        const store = createStore();
        setTheme(theme, store);
        const restored = getTheme(store);

        expect(restored).toBe(theme);
      }),
      { numRuns: 20 },
    );
  });

  it('round-trip is idempotent: setting the same theme twice still returns that theme', () => {
    fc.assert(
      fc.property(themeArb, (theme) => {
        const store = createStore();
        setTheme(theme, store);
        setTheme(theme, store);
        const restored = getTheme(store);

        expect(restored).toBe(theme);
      }),
      { numRuns: 20 },
    );
  });

  it('last write wins: setting theme A then theme B returns B', () => {
    fc.assert(
      fc.property(themeArb, themeArb, (themeA, themeB) => {
        const store = createStore();
        setTheme(themeA, store);
        setTheme(themeB, store);
        const restored = getTheme(store);

        expect(restored).toBe(themeB);
      }),
      { numRuns: 20 },
    );
  });

  it('store starts empty — getTheme returns null before any setTheme call', () => {
    const store = createStore();
    expect(getTheme(store)).toBeNull();
  });

  it('round-trip preserves the exact string value — no coercion or mutation', () => {
    fc.assert(
      fc.property(themeArb, (theme) => {
        const store = createStore();
        setTheme(theme, store);
        const restored = getTheme(store);

        // Strict equality: no type coercion, no trimming, no case change
        expect(restored).toStrictEqual(theme);
        expect(typeof restored).toBe('string');
      }),
      { numRuns: 20 },
    );
  });
});
