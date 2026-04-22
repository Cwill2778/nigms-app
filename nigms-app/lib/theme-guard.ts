import { createServerClient } from '@/lib/supabase';

export type ThemeGuardResult = { ok: true } | { ok: false; reason: string };

export async function validateThemeGuard(): Promise<ThemeGuardResult> {
  try {
    const expectedId = process.env.RUGGED_STANDARD_THEME_ID;

    if (!expectedId) {
      return { ok: false, reason: 'missing_env_var' };
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('theme_id')
      .eq('key', 'global')
      .single();

    if (error) {
      return { ok: false, reason: 'db_error' };
    }

    if (data?.theme_id === expectedId) {
      return { ok: true };
    }

    return { ok: false, reason: 'theme_id mismatch' };
  } catch {
    return { ok: false, reason: 'unexpected_error' };
  }
}
