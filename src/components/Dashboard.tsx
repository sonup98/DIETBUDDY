/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  Plus, TrendingUp, Award, Flame, GlassWater, Droplet, 
  ChevronRight, Calendar, Dumbbell, Apple, Salad, Sparkles, Smile 
} from "lucide-react";
import { UserProfile, LogEntry, MealTime } from "../types";

interface DashboardProps {
  profile: UserProfile;
  logEntries: LogEntry[];
  waterDrankMl: number;
  onAddWater: (amountMl: number) => void;
  onOpenAddFood: (meal: MealTime) => void;
  onNavigateToTab: (tab: string) => void;
  streak: number;
  weightTrendDiff: number; // weight gain/loss this week
}

export default function Dashboard({
  profile,
  logEntries,
  waterDrankMl,
  onAddWater,
  onOpenAddFood,
  onNavigateToTab,
  streak,
  weightTrendDiff
}: DashboardProps) {
  
  // Calculate day totals
  const totals = logEntries.reduce((acc, curr) => {
    acc.calories += curr.calories;
    acc.protein += curr.protein;
    acc.carbs += curr.carbs;
    acc.fat += curr.fat;
    acc.fiber += curr.fiber;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Safety caps
  const calPercent = Math.min(100, (totals.calories / profile.dailyCalories) * 100);
  const protPercent = Math.min(100, (totals.protein / profile.proteinGoal) * 100);
  const carbPercent = Math.min(100, (totals.carbs / profile.carbGoal) * 100);
  const fatPercent = Math.min(100, (totals.fat / profile.fatGoal) * 100);
  const fiberPercent = Math.min(100, (totals.fiber / profile.fiberGoal) * 100);
  const waterPercent = Math.min(100, (waterDrankMl / profile.waterGoal) * 100);

  const remainingCalories = profile.dailyCalories - totals.calories;

  // Re-usable Circular Ring Component
  const ProgressRing = ({ 
    percent, 
    size = 80, 
    strokeWidth = 8, 
    colorClass = "text-orange-500", 
    bgClass = "text-zinc-100 dark:text-zinc-800",
    label = "",
    value = "",
    icon: Icon
  }: { 
    percent: number, 
    size?: number, 
    strokeWidth?: number, 
    colorClass: string, 
    bgClass?: string,
    label: string,
    value: string,
    icon?: any
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex flex-col items-center space-y-2 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 shadow-xs flex-1 min-w-[110px]">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              className={bgClass}
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            {/* Colored indicator ring with smooth motion */}
            <circle
              className={`transition-all duration-700 ease-out ${colorClass}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {Icon ? (
              <Icon className="w-4 h-4 mb-0.5 text-zinc-400" />
            ) : null}
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white leading-none">
              {Math.round(percent)}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">{label}</span>
          <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mt-0.5">{value}</span>
        </div>
      </div>
    );
  };

  // Mock static data for the weekly animated visual bars
  const weeklyCalHistory = [1850, 2100, 1950, 2300, 1800, 2050, Math.round(totals.calories)];
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const maxCalVal = Math.max(...weeklyCalHistory, profile.dailyCalories);

  return (
    <div id="dashboard-tab" className="space-y-6 max-w-5xl mx-auto">
      
      {/* Greetings & Streak bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-orange-50/50 dark:bg-orange-950/20 p-6 rounded-[24px] border border-orange-100 dark:border-orange-900/30">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-800 dark:text-white">
            Hello, {profile.name}! <Smile className="inline w-5 h-5 text-orange-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Goal: <strong className="text-orange-600 dark:text-orange-400 capitalize">{profile.goal.replace("_", " ").toLowerCase()}</strong>. 
            Target weight: <strong>{profile.targetWeight} kg</strong>.
          </p>
        </div>

        {/* Streak & Scores info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white dark:bg-zinc-850 px-3.5 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <Flame className="w-5 h-5 text-orange-500 mr-1.5 animate-bounce" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Day Streak</span>
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-white leading-none">{streak} Days</span>
            </div>
          </div>
          <div className="flex items-center bg-white dark:bg-zinc-850 px-3.5 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <Award className="w-5 h-5 text-orange-500 mr-1.5" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Today's Score</span>
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-white leading-none">
                {Math.round(Math.min(100, calPercent * 0.4 + protPercent * 0.4 + waterPercent * 0.2))}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Calorie Tracker Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Remaining Calories visual card */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-[32px] p-6 flex flex-col justify-between shadow-sm border border-slate-100 dark:border-zinc-800/80 relative overflow-hidden">
          {/* Subtle decoration vector */}
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 text-orange-500">
            <svg width="120" height="120" viewBox="0 0 24 24"><path fill="currentColor" d="M17,17.25V14H18.5V17.25H17M12,17.25V14H13.5V17.25H12M7,17.25V14H8.5V17.25H7M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" /></svg>
          </div>
          
          <div className="space-y-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-display">Calorie Balance</span>
            
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-400 block font-medium">Remaining Today</span>
              <div className="font-display text-4xl font-black leading-none tracking-tight text-slate-800 dark:text-white">
                {remainingCalories >= 0 ? `${remainingCalories.toLocaleString()}` : `+${Math.abs(remainingCalories).toLocaleString()}`}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium pt-1">
                {remainingCalories >= 0 ? "kcal left to consume" : "kcal over daily target"}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${calPercent}%` }}></div>
            </div>

            <div className="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Goal</span>
                <span className="font-mono font-bold text-slate-700 dark:text-white mt-0.5 block">{profile.dailyCalories} kcal</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Eaten</span>
                <span className="font-mono font-bold text-orange-500 mt-0.5 block">{Math.round(totals.calories)} kcal</span>
              </div>
            </div>
          </div>

          <div className="mt-6 relative z-10 flex space-x-2">
            <button
              type="button"
              onClick={() => onOpenAddFood("Breakfast")}
              className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-md shadow-orange-100 dark:shadow-none"
              id="hero-add-breakfast"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Food</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab("ai")}
              className="px-3.5 bg-orange-50 hover:bg-orange-100 dark:bg-zinc-850 text-orange-500 dark:text-orange-400 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              title="Get Smart AI Insights"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Circular progress rings row */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <ProgressRing 
            percent={protPercent} 
            colorClass="text-rose-500" 
            label="Protein" 
            value={`${totals.protein.toFixed(1)} / ${profile.proteinGoal}g`}
            icon={Dumbbell}
          />
          <ProgressRing 
            percent={carbPercent} 
            colorClass="text-blue-500" 
            label="Carbs" 
            value={`${totals.carbs.toFixed(1)} / ${profile.carbGoal}g`}
            icon={Apple}
          />
          <ProgressRing 
            percent={fatPercent} 
            colorClass="text-amber-500" 
            label="Fats" 
            value={`${totals.fat.toFixed(1)} / ${profile.fatGoal}g`}
            icon={Salad}
          />
          <ProgressRing 
            percent={fiberPercent} 
            colorClass="text-orange-500" 
            label="Fiber" 
            value={`${totals.fiber.toFixed(1)} / ${profile.fiberGoal}g`}
            icon={Salad}
          />
          {/* Water widget with quick plus log */}
          <div className="flex flex-col items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/60 shadow-sm flex-1 min-w-[110px]">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  className="text-zinc-100 dark:text-zinc-800"
                  strokeWidth={8}
                  fill="transparent"
                  r={36}
                  cx={40}
                  cy={40}
                />
                <circle
                  className="transition-all duration-700 ease-out text-cyan-500"
                  strokeWidth={8}
                  strokeDasharray={226.2}
                  strokeDashoffset={226.2 - (waterPercent / 100) * 226.2}
                  strokeLinecap="round"
                  fill="transparent"
                  r={36}
                  cx={40}
                  cy={40}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <GlassWater className="w-4 h-4 mb-0.5 text-cyan-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-zinc-800 dark:text-white leading-none">
                  {Math.round(waterPercent)}%
                </span>
              </div>
            </div>
            
            <div className="text-center w-full mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Water</span>
              <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-zinc-300 block mt-0.5">{waterDrankMl} / {profile.waterGoal} ml</span>
              
              <button
                type="button"
                onClick={() => onAddWater(250)}
                className="w-full bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/20 dark:hover:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-bold text-[9px] uppercase tracking-wider py-1 rounded-md mt-2 flex items-center justify-center space-x-1"
                id="btn-quick-add-water"
              >
                <Plus className="w-3 h-3" />
                <span>+250ml</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard analytics (Weekly Progress, Weight trends) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly calories trend SVG Bar Chart */}
        <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Progress Tracker</span>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white mt-0.5">Weekly Calories History</h3>
            </div>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md uppercase">Target: {profile.dailyCalories} kcal</span>
          </div>

          {/* Core Animated SVG bar graph */}
          <div className="h-[155px] w-full flex items-end justify-between px-2 pt-3 border-b border-slate-100 dark:border-zinc-800/80 pb-1.5 font-sans">
            {weeklyCalHistory.map((val, i) => {
              const barHeightPercent = (val / maxCalVal) * 100;
              const isToday = i === 6;
              const isOverTarget = val > profile.dailyCalories;

              return (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip bubble on hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20">
                    {val} kcal
                  </div>

                  {/* Vertical bar */}
                  <div className="w-6.5 sm:w-8 bg-slate-50 dark:bg-zinc-800 rounded-t-lg h-[110px] flex items-end overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeightPercent}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`w-full rounded-t-md ${
                        isToday 
                          ? isOverTarget ? "bg-rose-500" : "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]" 
                          : isOverTarget ? "bg-amber-400/80" : "bg-slate-200 dark:bg-zinc-600"
                      }`}
                    />
                  </div>
                  {/* Day label */}
                  <span className={`text-[10px] font-bold mt-1.5 font-mono ${isToday ? "text-orange-500 font-extrabold" : "text-slate-400"}`}>
                    {daysOfWeek[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weight Trend card */}
        <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Scale Metrics</span>
            <div className="flex justify-between items-start mt-0.5">
              <h3 className="text-sm font-bold text-slate-850 dark:text-white">Weight Trend Analysis</h3>
              <button
                type="button"
                onClick={() => onNavigateToTab("weight")}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center transition-all cursor-pointer"
              >
                <span>Tracker Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 my-auto">
            {/* Current weight */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100/50 flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Current</span>
                <span className="font-mono text-base font-extrabold text-slate-800 dark:text-white">{profile.weight} kg</span>
              </div>
            </div>

            {/* Target offset */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100/50 flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-cyan-500" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Change this week</span>
                <span className={`font-mono text-sm font-extrabold ${weightTrendDiff <= 0 ? "text-orange-500" : "text-slate-600 dark:text-slate-300"}`}>
                  {weightTrendDiff <= 0 ? `${weightTrendDiff.toFixed(1)} kg` : `+${weightTrendDiff.toFixed(1)} kg`}
                </span>
              </div>
            </div>
          </div>

          {/* Motivation Quote/Insight banner */}
          <div className="bg-orange-50/50 dark:bg-orange-950/10 p-3.5 rounded-2xl border border-orange-100/50 dark:border-orange-900/30 text-orange-900 dark:text-orange-300 flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-[11px] leading-normal font-sans font-medium">
              You are on target to reach your weight goal of <strong>{profile.targetWeight} kg</strong> in approximately 4 weeks at this steady compliance level!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Meal addition selectors */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Quick Log Section</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "Breakfast", label: "🍳 Breakfast", desc: "Start strong" },
            { id: "Lunch", label: "🍱 Lunch", desc: "Fuel midday" },
            { id: "Dinner", label: "🍛 Dinner", desc: "Repair & recover" },
            { id: "Snacks", label: "🍌 Snacks", desc: "Energy boosters" }
          ].map((meal) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => onOpenAddFood(meal.id as MealTime)}
              className="p-4 text-left rounded-2xl bg-white dark:bg-zinc-900/60 hover:bg-orange-50/50 dark:hover:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-900/50 shadow-2xs transition-all flex flex-col justify-between h-[90px] cursor-pointer"
              id={`btn-quick-log-${meal.id}`}
            >
              <span className="text-xs font-extrabold text-slate-850 dark:text-white">{meal.label}</span>
              <span className="text-[10px] text-slate-400 leading-none">{meal.desc}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
