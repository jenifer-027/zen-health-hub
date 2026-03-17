import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userProfile, region } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Generate a 7-day Indian meal plan. Return ONLY valid JSON (no markdown).

USER:
- Age: ${userProfile?.age || 25}, Gender: ${userProfile?.gender || "male"}
- Height: ${userProfile?.height || 165}cm, Weight: ${userProfile?.weight || 65}kg, BMI: ${userProfile?.bmi || 24}
- Goal: ${userProfile?.goal || "maintain"} weight
- Activity: ${userProfile?.activity_level || "moderate"}
- Food preference: ${userProfile?.food_preferences || "veg"}
- Diseases: ${userProfile?.diseases?.join(", ") || "None"}
- Medications: ${userProfile?.medications?.join(", ") || "None"}
- Preferred region: ${region || "Pan-Indian"}

RULES:
1. Include 4 meals/day: Breakfast, Lunch, Snack, Dinner
2. Use authentic ${region || "Indian"} foods with traditional names
3. Indian portion sizes (cups, ladle, spoon)
4. Disease-safe foods ONLY
5. Adjust calories for goal: lose=1400-1600, gain=2200-2500, maintain=1700-1900
6. High protein options for each meal
7. Budget-friendly ingredients

Return JSON format:
{
  "daily_calories_target": number,
  "daily_protein_target": number,
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "meal_type": "Breakfast",
          "food_items": "description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "recipe_tip": "short tip",
          "ingredients": ["ingredient with qty", "ingredient with qty"]
        }
      ],
      "day_total": { "calories": number, "protein": number }
    }
  ],
  "grocery_list": {
    "Grains & Cereals": ["Rice 2kg", "Wheat flour 1kg"],
    "Lentils & Pulses": ["Toor dal 500g", "Moong dal 250g"],
    "Vegetables": ["Onion 1kg", "Tomato 500g"],
    "Fruits": ["Banana 6pcs", "Apple 4pcs"],
    "Dairy & Eggs": ["Milk 2L", "Curd 500g"],
    "Spices & Oils": ["Mustard oil 500ml", "Turmeric 50g"],
    "Non-Veg": ["Chicken 500g"],
    "Others": ["Jaggery 200g"]
  },
  "tips": ["tip1", "tip2"]
}
IMPORTANT: grocery_list must be an OBJECT with category keys and arrays of items with quantities. Skip Non-Veg for veg users.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Meal plan error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let mealPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      mealPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      mealPlan = null;
    }

    if (!mealPlan) {
      return new Response(JSON.stringify({ error: "Could not generate meal plan" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meal-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
