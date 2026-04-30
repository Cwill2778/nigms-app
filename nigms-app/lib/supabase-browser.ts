import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Creates a browser-side Supabase client for use in Client Components.
 * Uses the browser's cookie storage for session management.
 *
 * The client is typed with the full `Database` schema so all `.from()` calls
 * get accurate row/insert/update types.
 */
export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
