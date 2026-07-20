/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, Dumbbell, GlassWater, Apple, Salad, 
  Sparkles, Calendar, PieChart, Activity, Info 
} from "lucide-react";
import { UserProfile, LogEntry } from "../types";

interface AnalyticsProps {
  profile: UserProfile;
  logEntries: LogEntry[];
  waterDrankMl: number;
}

export default function Analytics({ profile, logEntries, waterDrankMl }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"macros" | "trends">("macros");

  // Sum macros
  const totalMacros = logEntries.reduce((acc, curr) => {
    acc.calories += curr.calories;
    acc.protein += curr.protein;
    acc.carbs += curr.carbs;
    acc.fat += curr.fat;
    acc.fiber += curr.fiber;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const totalGrams = Math.max(1, totalMacros.protein + totalMacros.carbs + totalMacros.fat);
  const protRatio = (totalMacros.protein / totalGrams) * 100;
  const carbRatio = (totalMacros.carbs / totalGrams) * 100;
  const fatRatio = (totalMacros.fat / totalGrams) * 100;

  // Mock static historical values for the multi-metric weekly reports
  const calorieHistory = [1850, 2100, 1950, 2200, 1800, 2050, Math.round(totalMacros.calories)];
  const proteinHistory = [135, 150, 142, 160, 130, 145, Math.round(totalMacros.protein)];
  const waterHistory = [2250, 2500, 2000, 3000, 2250, 2750, waterDrankMl];
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

  // Helper to draw a glowing SVG Line Chart
  const renderTrendsChart = (
    title: string, 
    history: number[], 
    target: number, 
    color: string, 
    glowColor: string,
    unit: string
  ) => {
    const width = 450;
    const height = 150;
    const padding = 25;
    
    const minVal = Math.min(...history, target) * 0.9;
    const maxVal = Math.max(...history, target) * 1.1;
    const range = maxVal - minVal || 1;

    const points = history.map((val, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y, val };
    });

    let d = "";
    points.forEach((p, idx) => {
      if (idx === 0) d += `M ${p.x} ${p.y}`;
      else d += ` L ${p.x} ${p.y}`;
    });

    const targetY = height - padding - ((target - minVal) / range) * (height - padding * 2);

    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{title}</span>
          <span className="font-mono text-[10px] text-zinc-400">Target: {target} {unit}</span>
        </div>

        <div className="relative w-full aspect-[22/8]">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Target line */}
            {targetY >= padding && targetY <= height - padding && (
              <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#f97316" strokeWidth={1} strokeDasharray="3 3" />
            )}

            {/* Solid glowing line */}
            <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />

            {/* Interaction points */}
            {points.map((p, idx) => (
              <g key={idx} className="group/dot">
                <circle cx={p.x} cy={p.y} r={3} fill="#ffffff" stroke={color} strokeWidth={2} />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="currentColor" className="text-[9px] font-mono font-bold fill-zinc-800 dark:fill-zinc-300 opacity-0 group-hover/dot:opacity-100 transition-all pointer-events-none">
                  {p.val}{unit}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div id="analytics-tab" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top filter navigator */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border">
        <div>
          <h2 className="text-lg font-sans font-extrabold text-zinc-900 dark:text-white">Nutrition Analytics</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Comprehensive visual representation of compliance.</p>
        </div>

        <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("macros")}
            className={`px-3 py-1 text-xs font-bold rounded-md uppercase transition-all ${
              activeTab === "macros"
                ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Macro Split
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trends")}
            className={`px-3 py-1 text-xs font-bold rounded-md uppercase transition-all ${
              activeTab === "trends"
                ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Weekly Trends
          </button>
        </div>
      </div>

      {activeTab === "macros" ? (
        /* MACROS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart / Macro Ring representation */}
          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border shadow-3xs flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Gram ratio</span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Active Macro Distribution</h3>
            </div>

            {logEntries.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                {/* SVG Donut Segment visualizer */}
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Protein sector */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth="10"
                      strokeDasharray={`${protRatio * 2.51} 251.2`}
                      strokeDashoffset="0"
                    />
                    {/* Carbs sector */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeDasharray={`${carbRatio * 2.51} 251.2`}
                      strokeDashoffset={`-${protRatio * 2.51}`}
                    />
                    {/* Fat sector */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      strokeDasharray={`${fatRatio * 2.51} 251.2`}
                      strokeDashoffset={`-${(protRatio + carbRatio) * 2.51}`}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-full w-28 h-28 m-auto border border-zinc-100">
                    <PieChart className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-zinc-400 leading-none">Total Logged</span>
                    <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white mt-1">{totalGrams.toFixed(0)}g</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full grid grid-cols-3 gap-2 mt-6">
                  <div className="text-center p-2 bg-rose-50/50 rounded-xl border">
                    <span className="text-[9px] font-bold uppercase text-rose-500 block">Protein</span>
                    <span className="font-mono text-xs font-bold text-zinc-800">{protRatio.toFixed(0)}%</span>
                  </div>
                  <div className="text-center p-2 bg-blue-50/50 rounded-xl border">
                    <span className="text-[9px] font-bold uppercase text-blue-500 block">Carbs</span>
                    <span className="font-mono text-xs font-bold text-zinc-800">{carbRatio.toFixed(0)}%</span>
                  </div>
                  <div className="text-center p-2 bg-amber-50/50 rounded-xl border">
                    <span className="text-[9px] font-bold uppercase text-amber-500 block">Fat</span>
                    <span className="font-mono text-xs font-bold text-zinc-800">{fatRatio.toFixed(0)}%</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-xs">
                Log food to display interactive macro distribution.
              </div>
            )}
          </div>

          {/* Macro Budget Balance */}
          <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border shadow-3xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Daily Macro Budget Completion</h3>
            
            <div className="space-y-4">
              {/* Protein indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="flex items-center text-rose-500"><Dumbbell className="w-3.5 h-3.5 mr-1" /> Protein Goal</span>
                  <span className="font-mono">{totalMacros.protein.toFixed(1)} / {profile.proteinGoal}g</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalMacros.protein / profile.proteinGoal) * 100)}%` }} />
                </div>
              </div>

              {/* Carbs indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="flex items-center text-blue-500"><Apple className="w-3.5 h-3.5 mr-1" /> Carbohydrate Goal</span>
                  <span className="font-mono">{totalMacros.carbs.toFixed(1)} / {profile.carbGoal}g</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalMacros.carbs / profile.carbGoal) * 100)}%` }} />
                </div>
              </div>

              {/* Fat indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="flex items-center text-amber-500"><Salad className="w-3.5 h-3.5 mr-1" /> Healthy Fat Goal</span>
                  <span className="font-mono">{totalMacros.fat.toFixed(1)} / {profile.fatGoal}g</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalMacros.fat / profile.fatGoal) * 100)}%` }} />
                </div>
              </div>

              {/* Fiber indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="flex items-center text-orange-500"><Salad className="w-3.5 h-3.5 mr-1" /> Dietary Fiber Goal</span>
                  <span className="font-mono">{totalMacros.fiber.toFixed(1)} / {profile.fiberGoal}g</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalMacros.fiber / profile.fiberGoal) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TRENDS VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderTrendsChart("Calorie Deficit Trend", calorieHistory, profile.dailyCalories, "#f97316", "rgba(249,115,22,0.2)", "kcal")}
            {renderTrendsChart("Protein Consistency Tracker", proteinHistory, profile.proteinGoal, "#f43f5e", "rgba(244,63,94,0.2)", "g")}
            {renderTrendsChart("Hydration Flow Log", waterHistory, profile.waterGoal, "#06b6d4", "rgba(6,182,212,0.2)", "ml")}
          </div>
        </div>
      )}

    </div>
  );
}
