import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Extract base64 data
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert plant pathologist. Analyze the image of the crop/leaf and identify any disease. Provide detailed diagnosis.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this crop/leaf image. Identify any disease, describe it, list symptoms, provide treatment solutions, and prevention tips.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "diagnose_disease",
            description: "Return plant disease diagnosis",
            parameters: {
              type: "object",
              properties: {
                diagnosis: {
                  type: "object",
                  properties: {
                    disease: { type: "string", description: "Name of the disease or 'Healthy' if no disease" },
                    confidence: { type: "string", description: "High, Medium, or Low" },
                    description: { type: "string" },
                    symptoms: { type: "array", items: { type: "string" } },
                    solutions: { type: "array", items: { type: "string" } },
                    preventionTips: { type: "array", items: { type: "string" } },
                  },
                  required: ["disease", "confidence", "description", "symptoms", "solutions", "preventionTips"],
                },
              },
              required: ["diagnosis"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "diagnose_disease" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required, please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { diagnosis: { disease: "Unknown", confidence: "Low", description: "Unable to analyze", symptoms: [], solutions: [], preventionTips: [] } };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disease-detect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
