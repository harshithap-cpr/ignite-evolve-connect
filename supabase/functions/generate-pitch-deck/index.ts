import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
            content: `Create a pitch deck and elevator pitch for:

TITLE: ${title}
PROBLEM: ${problem_statement}
SOLUTION: ${proposed_solution}
${analysisContext}

Generate 7 slides and a 1-minute elevator pitch script (about 150-170 words, naturally spoken pace).`,
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
                        title: { type: "string", description: "Slide title" },
                        subtitle: { type: "string", description: "Optional subtitle or tagline" },
                        bullets: {
                          type: "array",
                          items: { type: "string" },
                          description: "3-5 bullet points for this slide",
                        },
                        speaker_notes: { type: "string", description: "What to say when presenting this slide (2-3 sentences)" },
                        slide_type: {
                          type: "string",
                          enum: ["title", "problem", "solution", "market", "traction", "team", "ask"],
                          description: "Type of slide for styling",
                        },
                      },
                      required: ["slide_number", "title", "bullets", "speaker_notes", "slide_type"],
                      additionalProperties: false,
                    },
                    description: "7 pitch deck slides",
                  },
                  elevator_pitch: {
                    type: "string",
                    description: "A compelling 1-minute elevator pitch script (150-170 words)",
                  },
                  pitch_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 tips for delivering this pitch effectively",
                  },
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
