import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Creates a server-side Supabase client that reads/writes session cookies via
 * `next/headers`. Use this in Server Components, Route Handlers, and Server
 * Actions where `cookies()` is available.
 *
 * The client is typed with the full `Database` schema so all `.from()` calls
 * get accurate row/insert/update types.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

// Re-export browser client for convenience (server-safe re-export)
export { createBrowserClient } from './supabase-browser';
