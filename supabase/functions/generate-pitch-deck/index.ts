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
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.plan === "pro" || sub?.plan === "premium") return true;

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
    const auth = await authenticateUser(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, problem_statement, proposed_solution, analysis } = await req.json();

    if (!title || !problem_statement || !proposed_solution) {
      return new Response(JSON.stringify({ error: "Title, problem statement, and solution are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const analysisContext = analysis ? `
ANALYSIS DATA:
- Market Value: ${analysis.market_value}
- Market Growth: ${analysis.market_growth}
- Innovation Score: ${analysis.innovation_score}/10
- Feasibility Score: ${analysis.feasibility_score}/10
- Market Score: ${analysis.market_score}/10
- Overall Score: ${analysis.overall_score}/10
- Strengths: ${analysis.strengths?.join(", ")}
- Improvements: ${analysis.improvements?.join(", ")}
- Verdict: ${analysis.verdict}
- Target Customers: ${JSON.stringify(analysis.target_customers)}
- Competitors: ${JSON.stringify(analysis.competing_apps)}
` : "";

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
            content: `You are a pitch deck expert. Generate a professional 7-slide pitch deck and a compelling 1-minute elevator pitch script. Be specific, data-driven, and persuasive. Use the analysis data if provided.`,
          },
          {
            role: "user",
            content: `Create a pitch deck and elevator pitch for:\n\nTITLE: ${title}\nPROBLEM: ${problem_statement}\nSOLUTION: ${proposed_solution}\n${analysisContext}\n\nGenerate 7 slides and a 1-minute elevator pitch script (about 150-170 words, naturally spoken pace).`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_pitch_deck",
              description: "Generate pitch deck slides and elevator pitch",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        slide_number: { type: "number" },
                        title: { type: "string" },
                        subtitle: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                        speaker_notes: { type: "string" },
                        slide_type: { type: "string", enum: ["title", "problem", "solution", "market", "traction", "team", "ask"] },
                      },
                      required: ["slide_number", "title", "bullets", "speaker_notes", "slide_type"],
                      additionalProperties: false,
                    },
                  },
                  elevator_pitch: { type: "string" },
                  pitch_tips: { type: "array", items: { type: "string" } },
                },
                required: ["slides", "elevator_pitch", "pitch_tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_pitch_deck" } },
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
      return new Response(JSON.stringify({ error: "AI pitch deck generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return pitch deck data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pitchDeck = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(pitchDeck), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pitch-deck error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
