import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are "Fitzen Buddy", a warm, friendly Indian health & nutrition companion. You are like a caring friend, never a doctor.

USER PROFILE:
- Name: ${userProfile?.name || "Friend"}
- Age: ${userProfile?.age || "Unknown"}, Goal: ${userProfile?.goal || "maintain"}, BMI: ${userProfile?.bmi || "?"}
- Food Preference: ${userProfile?.food_preferences || "veg"}, Activity: ${userProfile?.activity_level || "moderate"}
- Health context: ${userProfile?.diseases?.length ? userProfile.diseases.join(", ") : "None noted"}

STRICT RULES:
1. Keep answers SHORT — 1 to 3 sentences max unless user asks for a plan
2. Suggest Indian foods first; include continental (pizza, burger, noodles, biryani) when asked
3. Use Indian portion sizes naturally — don't always list them
4. Be emotionally warm — never shame, never preach
5. DO NOT add "I'm your wellness buddy, not a doctor" disclaimer in EVERY message — only add it once if giving specific medical food advice
6. DO NOT mention user's diseases in every response — only use that context silently to guide safe suggestions
7. Use emojis sparingly — 1 or 2 max per message
8. If user misses protein, suggest a simple fix like "Add a boiled egg or paneer at dinner"
9. For cravings, suggest healthier Indian alternatives briefly
10. If asked for meal plan or detailed advice, then give a structured response`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
