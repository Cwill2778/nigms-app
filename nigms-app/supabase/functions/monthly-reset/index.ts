/**
 * Supabase Edge Function: monthly-reset
 *
 * Resets `minutes_used = 0` for all active subscriptions on the 1st of each month.
 * Implements Requirement 3.5: use-it-or-lose-it — unused minutes do not carry over.
 *
 * Deployment:
 *   supabase functions deploy monthly-reset
 *
 * Scheduling (via Supabase Dashboard → Database → Cron Jobs):
 *   Schedule: 0 0 1 * *   (midnight UTC on the 1st of every month)
 *   Command:  SELECT net.http_post(
 *               url := 'https://<project-ref>.supabase.co/functions/v1/monthly-reset',
 *               headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *             );
 *
 * Alternatively, invoke via pg_cron or an external scheduler (e.g. Vercel Cron).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST (or GET for manual triggers / health checks)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Reset minutes_used for all active subscriptions
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      minutes_used: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'active')
    .select('id');

  if (error) {
    console.error('[monthly-reset] failed to reset subscriptions', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const resetCount = data?.length ?? 0;
  console.log(`[monthly-reset] reset ${resetCount} active subscriptions`);

  return new Response(
    JSON.stringify({
      success: true,
      reset_count: resetCount,
      reset_at: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
