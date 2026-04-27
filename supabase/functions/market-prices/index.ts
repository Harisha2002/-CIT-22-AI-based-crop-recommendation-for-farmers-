import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { region } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a market data expert for agricultural commodities in India." },
          { role: "user", content: `Provide current approximate market prices for 15 major crops in ${region || "India"}. Include common crops like Rice, Wheat, Maize, Cotton, Sugarcane, Soybean, etc. Prices should be realistic and in INR.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "get_prices",
            description: "Return market prices for crops",
            parameters: {
              type: "object",
              properties: {
                prices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      crop: { type: "string" },
                      currentPrice: { type: "string" },
                      previousPrice: { type: "string" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                      unit: { type: "string" },
                      market: { type: "string" },
                    },
                    required: ["crop", "currentPrice", "previousPrice", "trend", "unit", "market"],
                  },
                },
              },
              required: ["prices"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "get_prices" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { prices: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-prices error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
