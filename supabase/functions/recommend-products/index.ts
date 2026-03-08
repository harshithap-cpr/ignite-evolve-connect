import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trl_level, idea_title, idea_description, category } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are a startup procurement advisor. Based on the TRL level, idea context, and category, recommend specific hardware and software products that the startup needs. Include real product names, estimated prices in INR (₹), and links to buy from Indian e-commerce platforms (Amazon.in, Flipkart, JioMart). Be practical and specific.`,
          },
          {
            role: "user",
            content: `TRL Level: ${trl_level || "Not specified"}
Idea: ${idea_title || "General startup"}
Description: ${idea_description || "No description"}
Category filter: ${category || "all"}

Recommend products this startup needs at their current stage.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_recommendations",
              description: "Provide structured product recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Product name" },
                        category: { type: "string", enum: ["dev_hardware", "software", "office_equipment", "iot_sensors", "cloud_services", "prototyping"] },
                        description: { type: "string", description: "Why this product is needed at this TRL stage" },
                        estimated_price: { type: "string", description: "Price in INR with ₹ symbol" },
                        priority: { type: "string", enum: ["essential", "recommended", "nice_to_have"] },
                        buy_links: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              platform: { type: "string", description: "Platform name (Amazon, Flipkart, JioMart, etc.)" },
                              url: { type: "string", description: "Search URL for the product on that platform" },
                            },
                            required: ["platform", "url"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "category", "description", "estimated_price", "priority", "buy_links"],
                      additionalProperties: false,
                    },
                  },
                  total_budget_estimate: { type: "string", description: "Total estimated budget in INR" },
                  procurement_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 procurement tips for this TRL stage",
                  },
                },
                required: ["recommendations", "total_budget_estimate", "procurement_tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI recommendation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured recommendations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-products error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
