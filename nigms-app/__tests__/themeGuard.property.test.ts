// Feature: industrial-framework-layout, Property 5: ThemeGuard returns ok:true iff theme_id matches

import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Validates: Requirements 4.2, 4.3

const RUGGED_UUID = 'fd3e8a11-0000-0000-0000-000000000001';

// Mock the supabase server client module before importing theme-guard
vi.mock('../lib/supabase', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '../lib/supabase';
import { validateThemeGuard } from '../lib/theme-guard';

describe('ThemeGuard ok iff UUID matches (Property 5)', () => {
  beforeEach(() => {
    process.env.RUGGED_STANDARD_THEME_ID = RUGGED_UUID;
  });

  it('returns { ok: true } iff mocked theme_id equals env var, { ok: false } otherwise', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (uuid) => {
        // Mock the Supabase query to return the generated uuid
        (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { theme_id: uuid }, error: null }),
              }),
            }),
          }),
        });

        const result = await validateThemeGuard();

        if (uuid === RUGGED_UUID) {
          return result.ok === true;
        } else {
          return result.ok === false;
        }
      }),
      { numRuns: 100 }
    );
  });
});
