/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Flame, GlassWater, Dumbbell, Sparkles, LayoutDashboard, 
  CalendarRange, TrendingUp, BarChart3, Settings as SettingsIcon, 
  Moon, Sun, ShieldAlert, Award, Footprints, Info 
} from "lucide-react";

import { UserProfile, LogEntry, WeightEntry, MealTime, Gender, ActivityLevel, FitnessGoal, DietType, CustomMeal, FavoriteShake } from "./types";
import ProfileWizard from "./components/ProfileWizard";
import AddFoodModal from "./components/AddFoodModal";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";
import WeightTracker from "./components/WeightTracker";
import AiInsights from "./components/AiInsights";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";

export default function App() {
  // Core states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [waterDrankMl, setWaterDrankMl] = useState<number>(0);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<CustomMeal[]>([]);
  const [favoriteShakes, setFavoriteShakes] = useState<FavoriteShake[]>([]);
  
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [activeAddMeal, setActiveAddMeal] = useState<MealTime | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(1);

  // 1. Load initial states from LocalStorage
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("dietbuddy_profile");
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      const storedLogs = localStorage.getItem("dietbuddy_logs");
      if (storedLogs) {
        setLogEntries(JSON.parse(storedLogs));
      }

      const storedWater = localStorage.getItem("dietbuddy_water");
      if (storedWater) {
        setWaterDrankMl(parseInt(storedWater) || 0);
      }

      const storedWeights = localStorage.getItem("dietbuddy_weights");
      if (storedWeights) {
        setWeightEntries(JSON.parse(storedWeights));
      }

      const storedStreak = localStorage.getItem("dietbuddy_streak");
      if (storedStreak) {
        setStreak(parseInt(storedStreak) || 1);
      }

      const storedFavMeals = localStorage.getItem("dietbuddy_fav_meals");
      if (storedFavMeals) {
        setFavoriteMeals(JSON.parse(storedFavMeals));
      }

      const storedFavShakes = localStorage.getItem("dietbuddy_fav_shakes");
      if (storedFavShakes) {
        setFavoriteShakes(JSON.parse(storedFavShakes));
      }

      // Read dark mode state or system default
      const storedTheme = localStorage.getItem("dietbuddy_theme");
      if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      console.error("Error reading localStorage keys:", e);
    }
  }, []);

  // 2. Persist state changes
  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("dietbuddy_profile", JSON.stringify(newProfile));
    
    // Add initial weight entry if none exist
    if (weightEntries.length === 0) {
      const initialEntry: WeightEntry = {
        id: "initial-wt",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: newProfile.weight,
        timestamp: Date.now(),
        bmi: newProfile.bmi,
        bodyFatEstimate: Number(((1.20 * newProfile.bmi) + (0.23 * newProfile.age) - (10.8 * (newProfile.gender === Gender.MALE ? 1 : 0)) - 5.4).toFixed(1))
      };
      setWeightEntries([initialEntry]);
      localStorage.setItem("dietbuddy_weights", JSON.stringify([initialEntry]));
    }
  };

  const handleUpdateLogs = (updatedLogs: LogEntry[]) => {
    setLogEntries(updatedLogs);
    localStorage.setItem("dietbuddy_logs", JSON.stringify(updatedLogs));
  };

  const handleUpdateWater = (newWater: number) => {
    setWaterDrankMl(newWater);
    localStorage.setItem("dietbuddy_water", newWater.toString());
  };

  const handleUpdateWeights = (updatedWeights: WeightEntry[]) => {
    setWeightEntries(updatedWeights);
    localStorage.setItem("dietbuddy_weights", JSON.stringify(updatedWeights));
  };

  const handleSaveCustomMeal = (meal: CustomMeal) => {
    const updated = [meal, ...favoriteMeals];
    setFavoriteMeals(updated);
    localStorage.setItem("dietbuddy_fav_meals", JSON.stringify(updated));
  };

  const handleSaveFavoriteShake = (shake: FavoriteShake) => {
    const updated = [shake, ...favoriteShakes];
    setFavoriteShakes(updated);
    localStorage.setItem("dietbuddy_fav_shakes", JSON.stringify(updated));
  };

  // Theme Toggler
  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dietbuddy_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dietbuddy_theme", "light");
    }
  };

  // Add Log Entry callback
  const handleAddLog = (foodItem: Omit<LogEntry, "id" | "timestamp">) => {
    const newEntry: LogEntry = {
      ...foodItem,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now()
    };

    const updated = [newEntry, ...logEntries];
    handleUpdateLogs(updated);
    setActiveAddMeal(null);

    // Update daily streak
    updateStreakOnInteraction();
  };

  // Portion Adjuster
  const handleUpdateLogPortion = (id: string, newWeight: number) => {
    const updated = logEntries.map((e) => {
      if (e.id === id) {
        // Calculate multipliers
        const multiplier = newWeight / e.weightGrams;
        return {
          ...e,
          weightGrams: newWeight,
          calories: Math.round(e.calories * multiplier),
          protein: Number((e.protein * multiplier).toFixed(1)),
          carbs: Number((e.carbs * multiplier).toFixed(1)),
          fat: Number((e.fat * multiplier).toFixed(1)),
          fiber: Number((e.fiber * multiplier).toFixed(1)),
          sugar: Number((e.sugar * multiplier).toFixed(1)),
          sodium: Number((e.sodium * multiplier).toFixed(1))
        };
      }
      return e;
    });
    handleUpdateLogs(updated);
  };

  // Remove Log Entry
  const handleRemoveLog = (id: string) => {
    const updated = logEntries.filter((e) => e.id !== id);
    handleUpdateLogs(updated);
  };

  // Quick log Water
  const handleAddWater = (amountMl: number) => {
    const nextWater = waterDrankMl + amountMl;
    handleUpdateWater(nextWater);
    updateStreakOnInteraction();
  };

  // Record scale weight
  const handleAddWeightEntry = (weight: number) => {
    if (!profile) return;
    
    // Calculate new BMI
    const nextBmi = Number((weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1));
    const nextBodyFat = Number(((1.20 * nextBmi) + (0.23 * profile.age) - (10.8 * (profile.gender === Gender.MALE ? 1 : 0)) - 5.4).toFixed(1));

    const newEntry: WeightEntry = {
      id: `wt-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight,
      timestamp: Date.now(),
      bmi: nextBmi,
      bodyFatEstimate: nextBodyFat
    };

    const updatedWeights = [newEntry, ...weightEntries];
    handleUpdateWeights(updatedWeights);

    // Also update current profile weight
    const updatedProfile = {
      ...profile,
      weight,
      bmi: nextBmi
    };
    saveProfile(updatedProfile);
  };

  const handleRemoveWeightEntry = (id: string) => {
    const updated = weightEntries.filter((w) => w.id !== id);
    handleUpdateWeights(updated);
  };

  // Streak logic calculations
  const updateStreakOnInteraction = () => {
    const lastInteractionDate = localStorage.getItem("dietbuddy_last_interaction");
    const todayStr = new Date().toDateString();

    if (lastInteractionDate !== todayStr) {
      let nextStreak = streak;
      if (lastInteractionDate) {
        const diffDays = Math.floor(
          (Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 1) {
          nextStreak += 1;
        } else {
          nextStreak = 1;
        }
      } else {
        nextStreak = 1;
      }
      setStreak(nextStreak);
      localStorage.setItem("dietbuddy_streak", nextStreak.toString());
      localStorage.setItem("dietbuddy_last_interaction", todayStr);
    }
  };

  // Hard Reset App
  const handleHardReset = () => {
    localStorage.clear();
    setProfile(null);
    setLogEntries([]);
    setWaterDrankMl(0);
    setWeightEntries([]);
    setStreak(1);
    setCurrentTab("dashboard");
    // Restore light theme default on resets
    setDarkMode(false);
    document.documentElement.classList.remove("dark");
  };

  // Calculate weight change this week
  const getWeightChangeThisWeek = () => {
    if (weightEntries.length < 2) return 0;
    const sorted = [...weightEntries].sort((a, b) => b.timestamp - a.timestamp); // latest first
    const latest = sorted[0].weight;
    // Find entry around 7 days ago, or the oldest if none
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const past = sorted.find((w) => w.timestamp < sevenDaysAgo) || sorted[sorted.length - 1];
    return latest - past.weight;
  };

  // If new user, render onboarding flow
  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-10 px-4 transition-colors duration-300">
        <ProfileWizard onComplete={saveProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-zinc-950 text-[#1D1D1F] dark:text-zinc-100 flex flex-col transition-colors duration-300 font-sans">
      
      {/* Top Header Shell */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-850 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
              <span className="text-white font-bold text-xl font-display">D</span>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white leading-none">
                DIET<span className="text-orange-500">BUDDY</span>
              </h1>
              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mt-0.5 block">Your Nutrition Companion</span>
            </div>
          </div>

          {/* Quick Header Indicators */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="font-mono">BMI: <strong className="text-slate-800 dark:text-white">{profile.bmi}</strong></span>
              <span className="text-gray-200 dark:text-zinc-850">|</span>
              <span className="font-mono">TDEE: <strong className="text-slate-800 dark:text-white">{profile.tdee} kcal</strong></span>
              <span className="text-gray-200 dark:text-zinc-850">|</span>
              <span className="capitalize text-orange-500 font-bold">{profile.dietType.toLowerCase().replace("_", " ")}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-600 dark:text-amber-400 border border-slate-200/50 dark:border-zinc-800 rounded-xl transition-all cursor-pointer animate-none"
              title="Toggle Day/Night Mode"
              id="theme-toggle-btn"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid content with pill navigation bar */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-8 py-6 pb-28">
        
        {/* Pills Navigation Menu bar */}
        <div className="flex space-x-1 overflow-x-auto pb-3 mb-6 border-b border-gray-100 dark:border-zinc-850/40 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "timeline", label: "Timeline", icon: CalendarRange },
            { id: "weight", label: "Weight", icon: TrendingUp },
            { id: "ai", label: "AI Coach", icon: Sparkles },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "settings", label: "Settings", icon: SettingsIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-full flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-orange-500 text-white dark:bg-orange-600 shadow-md shadow-orange-100 dark:shadow-none"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 hover:bg-slate-100/50 dark:hover:bg-zinc-900/30"
                }`}
                id={`nav-tab-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Inner Tab Component Routing */}
        <div className="min-h-[450px]">
          {currentTab === "dashboard" && (
            <Dashboard 
              profile={profile}
              logEntries={logEntries}
              waterDrankMl={waterDrankMl}
              onAddWater={handleAddWater}
              onOpenAddFood={setActiveAddMeal}
              onNavigateToTab={setCurrentTab}
              streak={streak}
              weightTrendDiff={getWeightChangeThisWeek()}
            />
          )}

          {currentTab === "timeline" && (
            <Timeline 
              logEntries={logEntries}
              waterDrankMl={waterDrankMl}
              onAddWater={handleAddWater}
              onRemoveLog={handleRemoveLog}
              onUpdateLogPortion={handleUpdateLogPortion}
              onOpenAddFood={setActiveAddMeal}
            />
          )}

          {currentTab === "weight" && (
            <WeightTracker 
              profile={profile}
              weightEntries={weightEntries}
              onAddWeightEntry={handleAddWeightEntry}
              onRemoveWeightEntry={handleRemoveWeightEntry}
            />
          )}

          {currentTab === "ai" && (
            <AiInsights 
              profile={profile}
              logEntries={logEntries}
              waterDrankMl={waterDrankMl}
            />
          )}

          {currentTab === "analytics" && (
            <Analytics 
              profile={profile}
              logEntries={logEntries}
              waterDrankMl={waterDrankMl}
            />
          )}

          {currentTab === "settings" && (
            <Settings 
              profile={profile}
              onUpdateProfile={saveProfile}
              onHardReset={handleHardReset}
            />
          )}
        </div>

      </main>

      {/* Persistent Quick Action floating buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => setActiveAddMeal("Breakfast")}
          className="w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_12px_24px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Quick log food entry"
          id="floating-add-food-btn"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Global Add Food Modal */}
      <AnimatePresence>
        {activeAddMeal && (
          <AddFoodModal 
            isOpen={true}
            onClose={() => setActiveAddMeal(null)}
            onAddLog={handleAddLog}
            mealTime={activeAddMeal}
            recentEntries={logEntries}
            favoriteMeals={favoriteMeals}
            favoriteShakes={favoriteShakes}
            onSaveCustomMeal={handleSaveCustomMeal}
            onSaveFavoriteShake={handleSaveFavoriteShake}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
