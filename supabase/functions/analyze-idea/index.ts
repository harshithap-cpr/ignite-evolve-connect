import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { problem_statement, proposed_solution } = await req.json();

    if (!problem_statement || !proposed_solution) {
      return new Response(JSON.stringify({ error: "Problem statement and solution are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `You are a startup analyst AI. Given a problem statement and proposed solution, analyze and return structured data. Be specific and realistic with numbers and names.`,
          },
          {
            role: "user",
            content: `Analyze this startup idea:

PROBLEM: ${problem_statement}

SOLUTION: ${proposed_solution}

Provide a detailed analysis.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide structured startup idea analysis",
              parameters: {
                type: "object",
                properties: {
                  market_value: {
                    type: "string",
                    description: "Estimated total addressable market value with currency (e.g., '$4.2 Billion by 2028')",
                  },
                  market_growth: {
                    type: "string",
                    description: "Market CAGR or growth trend (e.g., '12.5% CAGR')",
                  },
                  target_customers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        segment: { type: "string", description: "Customer segment name" },
                        size: { type: "string", description: "Estimated segment size" },
                        pain_level: { type: "string", enum: ["High", "Medium", "Low"] },
                      },
                      required: ["segment", "size", "pain_level"],
                      additionalProperties: false,
                    },
                    description: "3-5 target customer segments",
                  },
                  competing_apps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Competitor name" },
                        description: { type: "string", description: "What they do (1 sentence)" },
                        weakness: { type: "string", description: "Their main weakness you can exploit" },
                      },
                      required: ["name", "description", "weakness"],
                      additionalProperties: false,
                    },
                    description: "3-5 competing apps or solutions",
                  },
                  innovation_score: {
                    type: "number",
                    description: "Innovation score 1-10",
                  },
                  feasibility_score: {
                    type: "number",
                    description: "Feasibility score 1-10",
                  },
                  market_score: {
                    type: "number",
                    description: "Market potential score 1-10",
                  },
                  overall_score: {
                    type: "number",
                    description: "Overall score 1-10",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 key strengths of this idea",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 suggestions to improve the idea",
                  },
                  verdict: {
                    type: "string",
                    description: "A 2-3 sentence overall verdict on the idea's potential",
                  },
                },
                required: [
                  "market_value", "market_growth", "target_customers", "competing_apps",
                  "innovation_score", "feasibility_score", "market_score", "overall_score",
                  "strengths", "improvements", "verdict",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
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
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-idea error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
