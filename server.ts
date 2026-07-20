/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for AI coach insights
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { profile, entries, waterDrankMl } = req.body;

    if (!profile) {
      return res.status(400).json({ error: "User profile is required." });
    }

    // Prepare food log summary
    const foodSummary = entries && entries.length > 0
      ? entries.map((e: any) => `- ${e.name}: ${e.calories} kcal, Protein: ${e.protein}g, Carbs: ${e.carbs}g, Fat: ${e.fat}g, Fiber: ${e.fiber}g, Sugar: ${e.sugar}g, Sodium: ${e.sodium}mg`).join("\n")
      : "No food logged yet.";

    // Calculate totals
    const totals = (entries || []).reduce((acc: any, curr: any) => {
      acc.calories += curr.calories || 0;
      acc.protein += curr.protein || 0;
      acc.carbs += curr.carbs || 0;
      acc.fat += curr.fat || 0;
      acc.fiber += curr.fiber || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const prompt = `
You are DIETBUDDY AI, an elite friendly nutrition coach, personal trainer, and dietitian.
Analyze this user's current day metrics, profile, and dietary intake to provide elite coaching insights, a performance compliance score (0-100), and custom food suggestions.

USER PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Weight: ${profile.weight} kg, Target Weight: ${profile.targetWeight} kg
- Goal: ${profile.goal}
- Diet Type: ${profile.dietType}
- Target Calories: ${profile.dailyCalories} kcal
- Target Protein: ${profile.proteinGoal}g
- Target Carbs: ${profile.carbGoal}g
- Target Fat: ${profile.fatGoal}g
- Target Fiber: ${profile.fiberGoal}g
- Target Water: ${profile.waterGoal} ml

TODAY'S INTAKE:
- Total Calories Consumed: ${totals.calories.toFixed(1)} kcal
- Total Protein Consumed: ${totals.protein.toFixed(1)}g
- Total Carbs Consumed: ${totals.carbs.toFixed(1)}g
- Total Fat Consumed: ${totals.fat.toFixed(1)}g
- Total Fiber Consumed: ${totals.fiber.toFixed(1)}g
- Total Water Consumed: ${waterDrankMl} ml

FOODS LOGGED:
${foodSummary}

RULES:
1. Be encouraging, precise, and highly action-oriented.
2. If protein is short, recommend rich options based on diet type (${profile.dietType}). E.g., for VEGETARIAN/VEGAN, suggest Paneer, Soy Chunks, Soya Chaap, Curd, Lentils, or Pea Protein. For non-vegetarian, suggest eggs, chicken breast, or whey.
3. Suggest simple, highly digestible food swaps.
4. Calculate a realistic compliance score based on how close they are to their calorie (within +-150 is good), protein (at least 80% is good), fiber, and water targets.
5. Provide 3 specific bullet points for "insights" and 3 clear next steps for "recommendations".
`;

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      console.warn("Gemini client initialization bypassed. Using rich simulated coach response.", err.message);
      return res.json(generateSimulatedInsights(profile, totals, waterDrankMl));
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Compliance score out of 100 based on macro, fiber, and hydration matching."
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Category of the insight: 'praise' (success), 'warning' (overage/shortfall), 'suggestion' (swap), or 'tip' (educational value)"
                  },
                  text: {
                    type: Type.STRING,
                    description: "High impact concise coaching sentence, e.g., 'You are 25g short of your protein goal.' or 'Excellent fiber intake today!'"
                  }
                },
                required: ["type", "text"]
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Actionable dietary action items, e.g., 'Try adding 50g of soya chunks to your dinner.' or 'Drink 500ml of water now.'"
            }
          },
          required: ["score", "insights", "recommendations"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response content generated from Gemini.");
    }

    res.json(JSON.parse(responseText.trim()));
  } catch (error: any) {
    console.error("Error generating insights via Gemini:", error);
    res.status(500).json({ error: "Failed to generate coaching insights.", details: error.message });
  }
});

// Robust simulation engine if API key is not configured (or fails)
function generateSimulatedInsights(profile: any, totals: any, waterDrankMl: number) {
  const pShort = Math.max(0, profile.proteinGoal - totals.protein);
  const cDiff = totals.calories - profile.dailyCalories;
  const wShort = Math.max(0, profile.waterGoal - waterDrankMl);
  const fShort = Math.max(0, profile.fiberGoal - totals.fiber);

  const insights = [];
  const recommendations = [];
  let score = 100;

  // Calorie compliance
  if (Math.abs(cDiff) <= 150) {
    insights.push({
      type: "praise",
      text: "Phenomenal calorie control! You are within your perfect energy target zone."
    });
    score -= 0;
  } else if (cDiff > 150) {
    insights.push({
      type: "warning",
      text: `You are over your calorie budget by ${Math.round(cDiff)} kcal today.`
    });
    score -= Math.min(25, Math.round(cDiff / 15));
  } else {
    insights.push({
      type: "tip",
      text: `You have ${Math.round(-cDiff)} kcal left. Feel free to enjoy a nutritious snack.`
    });
    score -= Math.min(10, Math.round(-cDiff / 40));
  }

  // Protein compliance
  if (pShort === 0) {
    insights.push({
      type: "praise",
      text: "Incredible work! You have completely smashed your protein requirement."
    });
  } else if (pShort > 40) {
    insights.push({
      type: "warning",
      text: `You are ${Math.round(pShort)}g short of your protein goal. Muscle recovery needs protein.`
    });
    score -= 25;
    
    if (profile.dietType === "VEGETARIAN" || profile.dietType === "VEGAN") {
      recommendations.push("Consider mixing 35g of Soya Chunks or Tofu into your next meal to boost protein.");
      recommendations.push("A scoop of plant protein (pea/soy) will quickly close a large gap.");
    } else {
      recommendations.push("Add 150g of grilled chicken breast or 1 scoop of whey isolate.");
      recommendations.push("Hard-boiled eggs or paneer make excellent high-protein snack wraps.");
    }
  } else {
    insights.push({
      type: "suggestion",
      text: `You're just ${Math.round(pShort)}g away from your protein target. Almost there!`
    });
    score -= Math.round(pShort * 0.5);
    
    if (profile.dietType === "VEGETARIAN" || profile.dietType === "VEGAN") {
      recommendations.push("Snack on a handful of roasted almonds or chia seeds.");
    } else {
      recommendations.push("Enjoy 150g of light Greek curd or yogurt.");
    }
  }

  // Water compliance
  if (wShort === 0) {
    insights.push({
      type: "praise",
      text: "Hydration is flawless! Excellent water intake."
    });
  } else {
    insights.push({
      type: "tip",
      text: `Hydration target: ${Math.round(wShort)}ml remaining. Keep sipping!`
    });
    score -= Math.min(15, Math.round(wShort / 250));
    recommendations.push(`Drink at least ${Math.round(Math.min(wShort, 500))}ml of water before your next meal.`);
  }

  // Fiber compliance
  if (fShort === 0) {
    insights.push({
      type: "praise",
      text: "Excellent fiber intake today! Perfect for digestive wellness and gut health."
    });
  } else if (fShort > 10) {
    recommendations.push("Boost fiber by throwing a tablespoon of chia seeds or flax seeds into your drinks/oats.");
  }

  score = Math.max(30, Math.min(100, score));

  if (recommendations.length === 0) {
    recommendations.push("Keep up this premium streak! Consistency is the number one driver of results.");
    recommendations.push("Take a 15-minute post-meal stroll to boost metabolic rate.");
  }

  return {
    score,
    insights: insights.slice(0, 3),
    recommendations: recommendations.slice(0, 3)
  };
}

async function startServer() {
  // Vite setup for developer server vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DIETBUDDY] Fullstack server running on http://localhost:${PORT}`);
  });
}

startServer();
