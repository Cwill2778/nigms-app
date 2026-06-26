import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Web Push requires crypto operations - using the web-push approach
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string
) {
  // For Deno Edge Functions, we use the fetch-based push approach
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TTL": "86400",
    },
    body: payload,
  });
  return response;
}

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role to read all push subscriptions
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: "🔨 New Lead!",
      body: `${record.customer_name} submitted a $${(record.offered_price / 100).toFixed(0)} offer. Sign in to view.`,
      url: "/admin",
    });

    // Send to all subscribers
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushNotification(sub, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return new Response(
      JSON.stringify({ message: `Notified ${sent}/${subscriptions.length} subscribers` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
