/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Award, RefreshCw, AlertTriangle, CheckCircle, 
  HelpCircle, Lightbulb, Dumbbell, GlassWater, Zap, Compass, Flame 
} from "lucide-react";
import { UserProfile, LogEntry } from "../types";

interface AiInsightsProps {
  profile: UserProfile;
  logEntries: LogEntry[];
  waterDrankMl: number;
}

interface CoachInsight {
  type: "praise" | "warning" | "suggestion" | "tip";
  text: string;
}

interface AiResponse {
  score: number;
  insights: CoachInsight[];
  recommendations: string[];
}

export default function AiInsights({ profile, logEntries, waterDrankMl }: AiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Reading macronutrient logs...",
    "Scanning micronutrient & water balances...",
    "Consulting athletic nutritional formulas...",
    "Drafting personalized Coach's suggestions...",
    "Finalizing compliance scores..."
  ];

  // Rotate loading text for high-fidelity feel
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const triggerAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          entries: logEntries,
          waterDrankMl
        })
      });

      if (!response.ok) {
        throw new Error("Server failed to generate coaching insights.");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the Gemini server. Showing offline-simulated insights instead.");
      // Fallback local engine mock
      generateSimulatedFallback();
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedFallback = () => {
    const totals = logEntries.reduce((acc, curr) => {
      acc.calories += curr.calories;
      acc.protein += curr.protein;
      acc.carbs += curr.carbs;
      acc.fat += curr.fat;
      acc.fiber += curr.fiber;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const pShort = Math.max(0, profile.proteinGoal - totals.protein);
    const cDiff = totals.calories - profile.dailyCalories;
    const wShort = Math.max(0, profile.waterGoal - waterDrankMl);

    const insights: CoachInsight[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (Math.abs(cDiff) <= 150) {
      insights.push({ type: "praise", text: "Phenomenal calorie control! You are within your perfect energy target zone." });
    } else if (cDiff > 150) {
      insights.push({ type: "warning", text: `You are over your calorie budget by ${Math.round(cDiff)} kcal today.` });
      score -= Math.min(25, Math.round(cDiff / 15));
    } else {
      insights.push({ type: "tip", text: `You have ${Math.round(-cDiff)} kcal remaining. Feel free to enjoy a nutritious protein snack.` });
      score -= Math.min(10, Math.round(-cDiff / 40));
    }

    if (pShort === 0) {
      insights.push({ type: "praise", text: "Incredible work! You have completely smashed your protein requirement." });
    } else if (pShort > 40) {
      insights.push({ type: "warning", text: `You are ${Math.round(pShort)}g short of your protein goal. Muscle recovery needs protein.` });
      score -= 25;
      if (profile.dietType === "VEGETARIAN" || profile.dietType === "VEGAN") {
        recommendations.push("Consider mixing 40g of dry Soya Chunks or Tofu into your next meal to boost protein.");
        recommendations.push("A scoop of organic pea protein powder will close a large gap in seconds.");
      } else {
        recommendations.push("Add 150g of grilled chicken breast or 1 scoop of whey isolate.");
        recommendations.push("Hard-boiled eggs or paneer make excellent high-protein quick snacks.");
      }
    } else {
      insights.push({ type: "suggestion", text: `You're just ${Math.round(pShort)}g away from your protein target. Almost there!` });
      score -= Math.round(pShort * 0.5);
      if (profile.dietType === "VEGETARIAN" || profile.dietType === "VEGAN") {
        recommendations.push("Snack on a handful of raw almonds or chia seeds.");
      } else {
        recommendations.push("Enjoy 150g of light Greek curd or high protein yogurt.");
      }
    }

    if (wShort === 0) {
      insights.push({ type: "praise", text: "Hydration is flawless! Excellent water intake." });
    } else {
      insights.push({ type: "tip", text: `Hydration target: ${Math.round(wShort)}ml remaining. Keep sipping!` });
      score -= Math.min(15, Math.round(wShort / 250));
      recommendations.push(`Drink at least ${Math.round(Math.min(wShort, 500))}ml of water before your next meal.`);
    }

    score = Math.max(40, Math.min(100, score));

    if (recommendations.length === 0) {
      recommendations.push("Keep up this premium streak! Consistency is the number one driver of results.");
      recommendations.push("Take a 15-minute post-meal walk to boost your metabolic rate.");
    }

    setData({
      score,
      insights: insights.slice(0, 3),
      recommendations: recommendations.slice(0, 3)
    });
  };

  // Run initial analysis automatically on render to prevent blank screen
  useEffect(() => {
    triggerAiAnalysis();
  }, [logEntries.length, waterDrankMl]);

  const getInsightIcon = (type: string) => {
    const isPraise = type === "praise";
    return isPraise ? <CheckCircle className="w-5 h-5 text-orange-500" /> : 
      type === "warning" ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : 
      type === "suggestion" ? <Compass className="w-5 h-5 text-purple-500" /> : 
      <Lightbulb className="w-5 h-5 text-amber-500" />;
  };

  const getInsightCardColor = (type: string) => {
    switch (type) {
      case "praise": return "bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30 text-orange-900 dark:text-orange-300";
      case "warning": return "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-300";
      case "suggestion": return "bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30 text-purple-900 dark:text-purple-300";
      default: return "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-300";
    }
  };

  return (
    <div id="ai-insights-tab" className="space-y-6 max-w-3xl mx-auto">
      
      {/* Orbits Loader */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white dark:bg-zinc-900 rounded-3xl border shadow-3xs"
          >
            {/* Orbits Spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full border-4 border-dashed border-orange-500 animate-spin" />
              <div className="absolute w-10 h-10 rounded-full border-4 border-zinc-100 border-t-orange-500 animate-[spin_1s_linear_infinite]" />
              <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">DietBuddy Coach is Thinking</h3>
              <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 min-w-[260px] leading-none animate-pulse">
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <>
          {/* Notification Alert if offline */}
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[10px] font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
              {error}
            </div>
          )}

          {data && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score card block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Widget */}
                <div className="bg-zinc-950 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl md:col-span-1 border border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Compliance Coach</span>
                    <h3 className="text-sm font-bold text-zinc-400">Dietary Grade</h3>
                  </div>

                  <div className="my-6 flex flex-col items-center justify-center">
                    <span className="font-mono text-6xl font-extrabold text-white tracking-tight leading-none">{data.score}</span>
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-wider mt-2 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1" /> Perfect Score: 100
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 leading-normal text-center">
                    Your score is based on protein, fiber, and hydration matching within targets.
                  </p>
                </div>

                {/* Quick stats indicators */}
                <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-5 border shadow-3xs md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Daily Overview</h4>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">DietBuddy AI Health Assessment</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 my-auto">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border flex items-center space-x-3">
                      <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Calorie Gap</span>
                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white block">
                          {Math.round(profile.dailyCalories - logEntries.reduce((sum, e) => sum + e.calories, 0))} kcal left
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border flex items-center space-x-3">
                      <GlassWater className="w-5 h-5 text-cyan-500" />
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Hydration Gap</span>
                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white block">
                          {Math.max(0, profile.waterGoal - waterDrankMl)} ml left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-xl border text-orange-800 dark:text-orange-300 text-xs font-medium">
                    <Zap className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Your dietary profile is active. Hit recalculate inside Settings anytime.</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Alerts / Insights list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Coach's Live Insights</h4>
                
                <div className="space-y-2.5">
                  {data.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border flex items-start space-x-3.5 ${getInsightCardColor(insight.type)}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <p className="text-xs font-sans leading-normal font-medium">{insight.text}</p>
                    </div>
                  ))}
                  {data.insights.length === 0 && (
                    <div className="p-4 bg-zinc-50 rounded-2xl text-center text-xs italic text-zinc-400">
                      Log meals or water to trigger real-time nutrition alerts.
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Actionable Recommendations */}
              <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border shadow-3xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Actionable Swaps & Coach Recommendations
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Your Next Nutritional Action Items</h3>
                </div>

                <div className="space-y-2 pt-2">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 text-zinc-700 dark:text-zinc-300 text-xs bg-zinc-50/50 dark:bg-zinc-800/20 p-3 rounded-xl border border-transparent hover:border-zinc-100">
                      <div className="bg-orange-100/50 dark:bg-orange-950/20 text-orange-600 font-mono text-[10px] font-bold p-1 rounded-md shrink-0 w-6 text-center leading-none mt-0.5">
                        {index + 1}
                      </div>
                      <p className="leading-relaxed font-sans font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refresh CTA */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={triggerAiAnalysis}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-all border cursor-pointer"
                  id="btn-re-analyze"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Analyze Nutrition</span>
                </button>
              </div>

            </motion.div>
          )}
        </>
      )}

    </div>
  );
}
