/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Calendar, TrendingDown, Target, HelpCircle, 
  Sparkles, Check, Trash2, Info, ArrowRight, Clock, Percent 
} from "lucide-react";
import { UserProfile, WeightEntry, Gender, FitnessGoal } from "../types";

interface WeightTrackerProps {
  profile: UserProfile;
  weightEntries: WeightEntry[];
  onAddWeightEntry: (weight: number) => void;
  onRemoveWeightEntry: (id: string) => void;
}

export default function WeightTracker({
  profile,
  weightEntries,
  onAddWeightEntry,
  onRemoveWeightEntry
}: WeightTrackerProps) {
  const [inputWeight, setInputWeight] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("month");

  const handleSubmitWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputWeight);
    if (!parsed || parsed < 30 || parsed > 300) return;
    onAddWeightEntry(parsed);
    setInputWeight("");
  };

  // Adult body fat estimate formula based on BMI, Age, Gender
  // Adult Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × Gender) - 5.4
  // Gender: Male = 1, Female = 0
  const calculateBodyFatPercent = (bmi: number) => {
    const isMaleNum = profile.gender === Gender.MALE ? 1 : 0;
    const est = (1.20 * bmi) + (0.23 * profile.age) - (10.8 * isMaleNum) - 5.4;
    return Number(Math.max(3, Math.min(60, est)).toFixed(1));
  };

  const getFilteredEntries = () => {
    // Sort chronological first
    const sorted = [...weightEntries].sort((a, b) => a.timestamp - b.timestamp);
    if (timeFilter === "week") {
      return sorted.slice(-7);
    } else if (timeFilter === "month") {
      return sorted.slice(-30);
    }
    return sorted;
  };

  const filteredEntries = getFilteredEntries();

  // Goal prediction calculator
  const calculateGoalPrediction = () => {
    const currentWeight = profile.weight;
    const targetWeight = profile.targetWeight;
    const diff = targetWeight - currentWeight;

    if (Math.abs(diff) < 0.2) {
      return { weeks: 0, dateStr: "Goal Reached!", msg: "You have successfully achieved your target weight! Keep maintaining this amazing balance." };
    }

    let weeklyRate = 0.5; // default 0.5kg loss per week
    if (profile.goal === FitnessGoal.GAIN_WEIGHT || profile.goal === FitnessGoal.BUILD_MUSCLE) {
      weeklyRate = 0.25; // 0.25kg gain per week (lean muscle)
    }

    const absoluteDiff = Math.abs(diff);
    const weeksNeeded = Math.ceil(absoluteDiff / weeklyRate);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeksNeeded * 7));
    const formattedDate = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    let message = "";
    if (diff < 0) {
      message = `To lose ${absoluteDiff.toFixed(1)} kg at a healthy rate of ${weeklyRate} kg per week, you need approximately ${weeksNeeded} weeks.`;
    } else {
      message = `To gain ${absoluteDiff.toFixed(1)} kg of high quality mass at a rate of ${weeklyRate} kg per week, you need approximately ${weeksNeeded} weeks.`;
    }

    return {
      weeks: weeksNeeded,
      dateStr: formattedDate,
      msg: message
    };
  };

  const goalPrediction = calculateGoalPrediction();

  // Custom Line Graph Coordinates generator
  const renderLineGraph = () => {
    if (filteredEntries.length === 0) return null;
    
    const width = 500;
    const height = 180;
    const padding = 30;

    const weights = filteredEntries.map(e => e.weight);
    const minW = Math.min(...weights, profile.targetWeight) - 2;
    const maxW = Math.max(...weights, profile.targetWeight) + 2;
    const diffW = maxW - minW === 0 ? 1 : maxW - minW;

    const points = filteredEntries.map((entry, index) => {
      const x = padding + (index / (filteredEntries.length - 1 === 0 ? 1 : filteredEntries.length - 1)) * (width - padding * 2);
      const y = height - padding - ((entry.weight - minW) / diffW) * (height - padding * 2);
      return { x, y, weight: entry.weight, date: entry.date };
    });

    // Draw lines
    let d = "";
    points.forEach((p, idx) => {
      if (idx === 0) {
        d += `M ${p.x} ${p.y}`;
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    });

    // Target baseline Y
    const targetY = height - padding - ((profile.targetWeight - minW) / diffW) * (height - padding * 2);

    return (
      <div className="relative w-full aspect-[21/9] sm:aspect-[25/9] min-h-[180px] bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border p-2 overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid helper lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/80" strokeWidth={1} strokeDasharray={3} />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/80" strokeWidth={1} strokeDasharray={3} />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/80" strokeWidth={1} strokeDasharray={3} />

          {/* Target Weight Baseline */}
          {targetY >= padding && targetY <= height - padding && (
            <g>
              <line 
                x1={padding} 
                y1={targetY} 
                x2={width - padding} 
                y2={targetY} 
                stroke="#f97316" 
                strokeWidth={1.5} 
                strokeDasharray="4 4"
                className="opacity-70"
              />
              <text x={width - padding - 60} y={targetY - 5} fill="#f97316" className="text-[9px] font-mono font-bold uppercase tracking-wider">Target Goal</text>
            </g>
          )}

          {/* Core line path */}
          {d && (
            <path
              d={d}
              fill="none"
              stroke="#f97316"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_8px_rgba(249,115,22,0.2)] animate-[dash_1.5s_ease-in-out]"
            />
          )}

          {/* Interaction nodes (dots) */}
          {points.map((p, idx) => (
            <g key={idx} className="group/node">
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#ffffff"
                stroke="#f97316"
                strokeWidth={2}
                className="transition-all duration-300 hover:r-6 cursor-pointer"
              />
              {/* Tooltip on Node Hover */}
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fill="currentColor"
                className="text-[9px] font-mono font-extrabold fill-zinc-800 dark:fill-zinc-300 opacity-0 group-hover/node:opacity-100 transition-all pointer-events-none"
              >
                {p.weight} kg
              </text>
            </g>
          ))}
        </svg>

        {/* Floating labels */}
        <div className="absolute top-2 left-4 text-[9px] font-mono text-zinc-400">Weight Trend Line Graph</div>
        <div className="absolute bottom-1 right-8 text-[9px] font-mono text-orange-500">Live Data</div>
      </div>
    );
  };

  return (
    <div id="weight-tracker-tab" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Visual Line Graph Hero Panel */}
      <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border shadow-3xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Chronological history</span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">Scale Progression Trend</h3>
          </div>
          
          {/* Time range filters */}
          <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {[
              { id: "week", label: "7 Days" },
              { id: "month", label: "30 Days" },
              { id: "all", label: "All Logs" }
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTimeFilter(filter.id as any)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                  timeFilter === filter.id
                    ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs animate-fade-in"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {weightEntries.length > 1 ? (
          renderLineGraph()
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed">
            <TrendingDown className="w-8 h-8 opacity-30 text-orange-500 mb-2" />
            <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Line Chart Unavailable</span>
            <p className="text-xs text-zinc-400 mt-1 max-w-[250px] text-center">Log at least 2 separate weight entries to automatically render your scale charts.</p>
          </div>
        )}
      </div>

      {/* Grid: Form logger + prediction card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weight Logger input form */}
        <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Log Scale Metrics</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 mb-4">Record New Weight Entry</h3>
          </div>

          <form onSubmit={handleSubmitWeight} className="space-y-4 my-auto">
            <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/40 border p-3 rounded-2xl relative">
              <span className="text-xs text-zinc-400 font-extrabold uppercase mr-2">Scale Weight</span>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                placeholder={`Current: ${profile.weight} kg`}
                className="w-full bg-transparent border-none text-right font-mono font-extrabold text-2xl focus:ring-0 text-orange-500 placeholder-zinc-400"
                id="input-weight-logger"
              />
              <span className="font-bold text-zinc-400 text-sm pl-2">kg</span>
            </div>

            <button
              type="submit"
              disabled={!inputWeight}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 cursor-pointer"
              id="btn-log-weight"
            >
              <Check className="w-4 h-4" />
              <span>Log Scale Weight</span>
            </button>
          </form>

          <p className="text-[10px] text-zinc-400 leading-normal mt-4">
            *Always weigh yourself at the same time of day (preferably in the morning before food/water) for maximum trend consistency.
          </p>
        </div>

        {/* Prediction Goal card */}
        <div className="bg-zinc-950 text-white rounded-3xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-zinc-800">
          {/* Glowing vectors */}
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl" />

          <div className="space-y-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Target Forecast</span>
            
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 block">Estimated Goal Completion Date</span>
              <div className="font-mono text-3xl font-extrabold text-white leading-none tracking-tight flex items-center">
                <Target className="w-6 h-6 text-orange-400 mr-2 animate-pulse" />
                {goalPrediction.dateStr}
              </div>
            </div>

            <div className="p-3 bg-zinc-900/60 rounded-xl text-xs border border-zinc-800 text-zinc-300">
              {goalPrediction.msg}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 mt-4 relative z-10 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block">BMI Index</span>
              <span className="font-mono text-sm font-bold text-white block mt-0.5">{profile.bmi}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block flex items-center"><Percent className="w-2.5 h-2.5 mr-0.5" /> Body Fat Est.</span>
              <span className="font-mono text-sm font-bold text-orange-400 block mt-0.5">{calculateBodyFatPercent(profile.bmi)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* History log entries table */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border shadow-3xs overflow-hidden">
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Weight Logs Registry</span>
          <span className="text-[10px] text-zinc-400 font-mono">{weightEntries.length} logged data points</span>
        </div>

        <div className="divide-y max-h-[220px] overflow-y-auto">
          {weightEntries.map((entry) => (
            <div key={entry.id} className="p-3.5 flex justify-between items-center text-xs hover:bg-zinc-50/30">
              <div className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span className="font-semibold font-mono">{entry.date}</span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="font-mono text-[10px] text-zinc-400">BMI: {entry.bmi}</span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="font-mono text-[10px] text-orange-500 font-bold">Fat: {entry.bodyFatEstimate}%</span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-mono font-extrabold text-zinc-900 dark:text-white">{entry.weight} kg</span>
                <button
                  type="button"
                  onClick={() => onRemoveWeightEntry(entry.id)}
                  className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                  id={`btn-remove-weight-${entry.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {weightEntries.length === 0 && (
            <div className="py-8 text-center text-zinc-400 italic">No weight entries recorded.</div>
          )}
        </div>
      </div>

    </div>
  );
}
