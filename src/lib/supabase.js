import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ymwnxybthgpsjczgknvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd254eWJ0aGdwc2pjemdrbnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjM3NDQsImV4cCI6MjA5NzczOTc0NH0.nUlLA-RD4MkgulloEY81VaMndEEJAFKPNBLDKGB8UIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
