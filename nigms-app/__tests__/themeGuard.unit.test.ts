// Unit tests for ThemeGuard
// Validates: Requirements 4.2, 4.3, 4.4

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const RUGGED_UUID = 'fd3e8a11-0000-0000-0000-000000000001';

vi.mock('../lib/supabase', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '../lib/supabase';
import { validateThemeGuard } from '../lib/theme-guard';

const mockClient = (single: () => Promise<{ data: unknown; error: unknown }>) => {
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ single }),
      }),
    }),
  });
};

describe('ThemeGuard unit tests', () => {
  beforeEach(() => {
    process.env.RUGGED_STANDARD_THEME_ID = RUGGED_UUID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns { ok: true } when theme_id matches env var', async () => {
    mockClient(async () => ({ data: { theme_id: RUGGED_UUID }, error: null }));
    const result = await validateThemeGuard();
    expect(result).toEqual({ ok: true });
  });

  it('returns { ok: false } when theme_id does not match env var', async () => {
    mockClient(async () => ({ data: { theme_id: 'different-uuid' }, error: null }));
    const result = await validateThemeGuard();
    expect(result.ok).toBe(false);
  });

  it('returns { ok: false, reason: "db_error" } on DB error', async () => {
    mockClient(async () => ({ data: null, error: { message: 'connection failed' } }));
    const result = await validateThemeGuard();
    expect(result).toEqual({ ok: false, reason: 'db_error' });
  });

  it('returns { ok: false, reason: "missing_env_var" } when env var is absent', async () => {
    delete process.env.RUGGED_STANDARD_THEME_ID;
    mockClient(async () => ({ data: { theme_id: RUGGED_UUID }, error: null }));
    const result = await validateThemeGuard();
    expect(result).toEqual({ ok: false, reason: 'missing_env_var' });
  });
});
