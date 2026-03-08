import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_LIMIT = 2;

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;

  return { userId: data.claims.sub as string, supabase };
}

async function checkUsageGate(supabase: any, userId: string, feature: string) {
  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.plan === "pro" || sub?.plan === "premium") return true;

  // Check usage count
  const { count } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature);

  return (count || 0) < FREE_LIMIT;
}

async function recordUsage(supabase: any, userId: string, feature: string) {
  await supabase.from("usage_tracking").insert({ user_id: userId, feature });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate
    const auth = await authenticateUser(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { problem_statement, proposed_solution } = await req.json();

    if (!problem_statement || !proposed_solution) {
      return new Response(JSON.stringify({ error: "Problem statement and solution are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage gate server-side
    const canUse = await checkUsageGate(auth.supabase, auth.userId, "analyze-idea");
    if (!canUse) {
      return new Response(JSON.stringify({ error: "Free usage limit reached. Please upgrade to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            content: `You are a startup analyst AI. Given a problem statement and proposed solution, analyze and return structured data. Be specific and realistic with numbers and names. Also evaluate the ethical implications and novelty/originality of the idea.`,
          },
          {
            role: "user",
            content: `Analyze this startup idea:\n\nPROBLEM: ${problem_statement}\n\nSOLUTION: ${proposed_solution}\n\nProvide a detailed analysis including ethical considerations and novelty assessment.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide structured startup idea analysis with ethical and novelty checks",
              parameters: {
                type: "object",
                properties: {
                  market_value: { type: "string", description: "Estimated total addressable market value with currency (e.g., '$4.2 Billion by 2028')" },
                  market_growth: { type: "string", description: "Market CAGR or growth trend (e.g., '12.5% CAGR')" },
                  target_customers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        segment: { type: "string" }, size: { type: "string" },
                        pain_level: { type: "string", enum: ["High", "Medium", "Low"] },
                      },
                      required: ["segment", "size", "pain_level"], additionalProperties: false,
                    },
                  },
                  competing_apps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" }, description: { type: "string" }, weakness: { type: "string" },
                      },
                      required: ["name", "description", "weakness"], additionalProperties: false,
                    },
                  },
                  innovation_score: { type: "number" }, feasibility_score: { type: "number" },
                  market_score: { type: "number" },
                  ethical_score: { type: "number", description: "Ethical score 1-10." },
                  novelty_score: { type: "number", description: "Novelty/originality score 1-10." },
                  overall_score: { type: "number" },
                  ethical_analysis: {
                    type: "object",
                    properties: {
                      privacy_concern: { type: "string" }, social_impact: { type: "string" },
                      fairness: { type: "string" }, environmental_impact: { type: "string" },
                      risk_level: { type: "string", enum: ["Low", "Medium", "High"] },
                    },
                    required: ["privacy_concern", "social_impact", "fairness", "environmental_impact", "risk_level"],
                    additionalProperties: false,
                  },
                  novelty_analysis: {
                    type: "object",
                    properties: {
                      uniqueness: { type: "string" }, prior_art: { type: "string" },
                      differentiator: { type: "string" },
                      patentability: { type: "string", enum: ["High", "Medium", "Low"] },
                    },
                    required: ["uniqueness", "prior_art", "differentiator", "patentability"],
                    additionalProperties: false,
                  },
                  strengths: { type: "array", items: { type: "string" } },
                  improvements: { type: "array", items: { type: "string" } },
                  verdict: { type: "string" },
                },
                required: [
                  "market_value", "market_growth", "target_customers", "competing_apps",
                  "innovation_score", "feasibility_score", "market_score", "overall_score",
                  "ethical_score", "novelty_score", "ethical_analysis", "novelty_analysis",
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

    // Record usage server-side
    await recordUsage(auth.supabase, auth.userId, "analyze-idea");

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
