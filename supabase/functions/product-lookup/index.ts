import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, store } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      return new Response(JSON.stringify({ error: "SERPAPI_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url: string;

    if (store === "Home Depot") {
      // Use Home Depot engine with Rome GA store ID
      url = `https://serpapi.com/search.json?engine=home_depot&q=${encodeURIComponent(query)}&store_id=0139&api_key=${SERPAPI_KEY}`;
    } else {
      // Use Google Shopping for other stores
      url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query + " " + store + " Rome GA")}&api_key=${SERPAPI_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    let results: Array<{ name: string; price: number | null; aisle: string; link: string }> = [];

    if (data.products && data.products.length > 0) {
      // Home Depot results
      results = data.products.slice(0, 8).map((p: any) => ({
        name: p.title || "",
        price: p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, "")) : null,
        aisle: p.aisle || "",
        link: p.link || "",
      }));
    } else if (data.shopping_results && data.shopping_results.length > 0) {
      // Google Shopping results
      results = data.shopping_results.slice(0, 8).map((p: any) => ({
        name: p.title || "",
        price: p.extracted_price || null,
        aisle: "",
        link: p.link || "",
      }));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
