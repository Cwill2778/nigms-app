/**
 * Supabase Edge Function: time-allocation-alert
 *
 * Runs daily. Finds active subscriptions where:
 *   - status = 'active'
 *   - minutes_used < monthly_allocation_minutes (unused minutes remain)
 *   - current_period_end is within 5 days from now
 *
 * For each matching subscription:
 *   - Creates an in-app notification for the subscriber
 *   - Sends a branded email alert
 *
 * Implements Requirement 4.5
 *
 * Deployment:
 *   supabase functions deploy time-allocation-alert
 *
 * Scheduling (via Supabase Dashboard → Database → Cron Jobs):
 *   Schedule: 0 9 * * *   (9:00 AM UTC daily)
 *   Command:  SELECT net.http_post(
 *               url := 'https://<project-ref>.supabase.co/functions/v1/time-allocation-alert',
 *               headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *             );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Branded email builder (inline — no shared lib in Deno edge functions) ────

function buildBrandedHtml(html: string): string {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1B263B; padding: 24px; text-align: center;">
        <h1 style="color: #FF7F7F; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.1em;">NAILED IT</h1>
        <p style="color: #778DA9; margin: 4px 0 0; font-size: 12px; letter-spacing: 0.05em;">General Maintenance &amp; Property Solutions</p>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        ${html}
      </div>
      <div style="background: #F4F5F7; padding: 16px; text-align: center; border-top: 2px solid #FF7F7F;">
        <p style="color: #778DA9; font-size: 12px; margin: 0;">© Nailed It General Maintenance &amp; Property Solutions</p>
      </div>
    </div>
  `;
}

async function sendBrandedEmail(opts: {
  resendApiKey: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nailed It <noreply@naileditmaintenance.com>',
        to: opts.to,
        subject: opts.subject,
        html: buildBrandedHtml(opts.html),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[time-allocation-alert] Resend error', { status: response.status, text });
    }
  } catch (err) {
    console.error('[time-allocation-alert] sendBrandedEmail failed', err);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  // 5 days from now
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Find active subscriptions with unused minutes and ≤5 days remaining
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('id, user_id, tier, monthly_allocation_minutes, minutes_used, current_period_end')
    .eq('status', 'active')
    .not('current_period_end', 'is', null)
    .lte('current_period_end', fiveDaysFromNow.toISOString())
    .gte('current_period_end', now.toISOString()); // not already expired

  if (subError) {
    console.error('[time-allocation-alert] failed to query subscriptions', subError);
    return new Response(
      JSON.stringify({ error: subError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('[time-allocation-alert] no subscriptions require alerts');
    return new Response(
      JSON.stringify({ success: true, alerted_count: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Filter to only those with unused minutes
  const alertable = subscriptions.filter(
    (s: { minutes_used: number; monthly_allocation_minutes: number }) =>
      s.minutes_used < s.monthly_allocation_minutes
  );

  let alertedCount = 0;

  for (const sub of alertable as {
    id: string;
    user_id: string;
    tier: string;
    monthly_allocation_minutes: number;
    minutes_used: number;
    current_period_end: string;
  }[]) {
    const minutesRemaining = sub.monthly_allocation_minutes - sub.minutes_used;
    const periodEnd = new Date(sub.current_period_end);
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', sub.user_id)
      .single();

    if (!user) continue;

    const u = user as { id: string; email: string | null; full_name: string | null };

    // Create in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: u.id,
        type: 'time_allocation_alert',
        title: 'Service Minutes Expiring Soon',
        body: `You have ${minutesRemaining} unused service minutes expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Schedule a preventative maintenance check before they expire.`,
        entity_type: 'subscription',
        entity_id: sub.id,
        read_at: null,
      });

    // Send branded email if we have an API key and email address
    if (resendApiKey && u.email) {
      await sendBrandedEmail({
        resendApiKey,
        to: u.email,
        subject: 'Action Required: Your Service Minutes Are Expiring Soon',
        html: `
          <h2 style="color:#1B263B;margin-top:0;">Your Service Minutes Are Expiring Soon</h2>
          <p>Hi ${u.full_name ?? 'there'},</p>
          <p>You have unused service minutes that will expire at the end of your current billing period.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr>
              <td style="padding:8px;border:1px solid #F4F5F7;color:#778DA9;">Unused Minutes</td>
              <td style="padding:8px;border:1px solid #F4F5F7;font-weight:700;">${minutesRemaining}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #F4F5F7;color:#778DA9;">Days Remaining</td>
              <td style="padding:8px;border:1px solid #F4F5F7;font-weight:700;">${daysRemaining}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #F4F5F7;color:#778DA9;">Period Ends</td>
              <td style="padding:8px;border:1px solid #F4F5F7;font-weight:700;">${periodEnd.toLocaleDateString()}</td>
            </tr>
          </table>
          <p>Don't let your minutes go to waste — schedule a preventative maintenance check today.</p>
          <p>
            <a href="${supabaseUrl.replace('.supabase.co', '')}/dashboard" 
               style="display:inline-block;background:#FF7F7F;color:#1B263B;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700;">
              Schedule Now
            </a>
          </p>
          <p style="color:#778DA9;font-size:12px;">Unused minutes do not carry over to the next billing period.</p>
        `,
      });
    }

    alertedCount++;
    console.log(`[time-allocation-alert] alerted user ${u.id} (${minutesRemaining} min remaining, ${daysRemaining} days left)`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      alerted_count: alertedCount,
      checked_count: subscriptions.length,
      run_at: now.toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
