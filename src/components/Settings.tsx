/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Save, RotateCcw, ShieldAlert, Check, HelpCircle, 
  Settings as SettingsIcon, Info, Dumbbell, User, Award, Flame 
} from "lucide-react";
import { UserProfile, Gender, ActivityLevel, FitnessGoal, DietType } from "../types";

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onHardReset: () => void;
}

export default function Settings({ profile, onUpdateProfile, onHardReset }: SettingsProps) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [goal, setGoal] = useState(profile.goal);
  const [dietType, setDietType] = useState(profile.dietType);
  const [saved, setSaved] = useState(false);

  // Mifflin-St Jeor Formula
  const handleSaveAndRecalculate = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Calculate BMR
    let bmr = 0;
    if (gender === Gender.MALE) {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // 2. Multiply by Activity Multiplier to get TDEE
    let multiplier = 1.2;
    switch (activityLevel) {
      case ActivityLevel.LIGHT: multiplier = 1.375; break;
      case ActivityLevel.MODERATE: multiplier = 1.55; break;
      case ActivityLevel.ACTIVE: multiplier = 1.725; break;
      case ActivityLevel.ATHLETE: multiplier = 1.9; break;
    }
    const tdee = bmr * multiplier;

    // 3. Set calorie target depending on Goals
    let calorieTarget = tdee;
    if (goal === FitnessGoal.LOSE_FAT) {
      calorieTarget = tdee - 500; // 500 kcal deficit
    } else if (goal === FitnessGoal.BUILD_MUSCLE || goal === FitnessGoal.GAIN_WEIGHT) {
      calorieTarget = tdee + 300; // 300 kcal surplus
    }

    calorieTarget = Math.round(calorieTarget);

    // 4. Calculate customized macronutrient splits based on goals & diet type
    // Protein: Lose fat/Build Muscle needs higher protein (2.0g per kg or 2.2g per kg). Maintain weight is 1.6g per kg.
    let protMultiplier = 1.6;
    if (goal === FitnessGoal.LOSE_FAT || goal === FitnessGoal.BUILD_MUSCLE) {
      protMultiplier = 2.0;
    }

    const proteinGoal = Math.round(weight * protMultiplier);
    const proteinCal = proteinGoal * 4;

    // Fat goal: 25% of total calories (1g fat = 9 kcal)
    const fatGoal = Math.round((calorieTarget * 0.25) / 9);
    const fatCal = fatGoal * 9;

    // Carbs is remainder
    const carbGoal = Math.round(Math.max(20, (calorieTarget - proteinCal - fatCal) / 4));

    // Fiber & Sugar
    const fiberGoal = Math.round((calorieTarget / 1000) * 14); // 14g per 1000kcal
    const waterGoal = Math.round(weight * 35); // 35ml per kg of body weight

    const bmi = Number((weight / ((height / 100) * (height / 100))).toFixed(1));

    const updatedProfile: UserProfile = {
      name,
      age,
      gender,
      height,
      heightUnit: profile.heightUnit,
      weight,
      targetWeight,
      activityLevel,
      goal,
      dietType,
      isCalculated: true,
      dailyCalories: calorieTarget,
      proteinGoal,
      carbGoal,
      fatGoal,
      fiberGoal,
      waterGoal,
      bmi,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee)
    };

    onUpdateProfile(updatedProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div id="settings-tab" className="space-y-6 max-w-3xl mx-auto">
      
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border">
        <div className="flex items-center space-x-2.5">
          <SettingsIcon className="w-5 h-5 text-zinc-500" />
          <div>
            <h2 className="text-lg font-sans font-extrabold text-zinc-900 dark:text-white">Profile Settings</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Customize metric targets, physical ratios, and BMR constants.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAndRecalculate} className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border shadow-3xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Name input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-white focus:outline-orange-500"
              id="settings-input-name"
            />
          </div>

          {/* Age input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Age</label>
            <input
              type="number"
              required
              min="10"
              max="110"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-white focus:outline-orange-500"
              id="settings-input-age"
            />
          </div>

          {/* Biological Gender */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Biological Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-850 dark:text-white focus:outline-orange-500 cursor-pointer"
            >
              <option value={Gender.MALE}>Male</option>
              <option value={Gender.FEMALE}>Female</option>
            </select>
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Height (cm)</label>
            <input
              type="number"
              required
              min="100"
              max="250"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-white focus:outline-orange-500"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Scale Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              min="30"
              max="300"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-white focus:outline-orange-500"
            />
          </div>

          {/* Target Weight */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Target Weight Goal (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              min="30"
              max="300"
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-white focus:outline-orange-500"
            />
          </div>

          {/* Activity multiplier */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Weekly Activity Multiplier</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-850 dark:text-white focus:outline-orange-500 cursor-pointer"
            >
              <option value={ActivityLevel.SEDENTARY}>Sedentary (desk job, no training)</option>
              <option value={ActivityLevel.LIGHT}>Light Exercise (1-3 days/week training)</option>
              <option value={ActivityLevel.MODERATE}>Moderate Exercise (3-5 days/week training)</option>
              <option value={ActivityLevel.ACTIVE}>Active Athlete (6-7 days/week heavy training)</option>
            </select>
          </div>

          {/* Primary Goal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Dietary Goal Direction</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-850 dark:text-white focus:outline-orange-500 cursor-pointer"
            >
              <option value={FitnessGoal.LOSE_FAT}>Lose Body Fat (-500 kcal deficit)</option>
              <option value={FitnessGoal.BUILD_MUSCLE}>Build Lean Muscle Mass (+300 kcal surplus)</option>
              <option value={FitnessGoal.MAINTAIN}>Maintain Weight (TDEE balancing)</option>
              <option value={FitnessGoal.GAIN_WEIGHT}>Gain Weight (+300 kcal surplus)</option>
            </select>
          </div>

          {/* Macro Diet Split Strategy */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Nutritional Strategy Ratio</label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value as DietType)}
              className="w-full bg-zinc-50 dark:bg-zinc-850 border rounded-xl px-3.5 py-2 text-sm text-zinc-850 dark:text-white focus:outline-orange-500 cursor-pointer"
            >
              <option value={DietType.NON_VEGETARIAN}>Standard Balance (45% C, 30% P, 25% F)</option>
              <option value={DietType.VEGETARIAN}>Vegetarian Balance (Increased fiber constants)</option>
              <option value={DietType.VEGAN}>Vegan Balance (100% plant protein parameters)</option>
            </select>
          </div>

        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
          <div className="flex items-center text-xs text-zinc-400">
            {saved ? (
              <span className="text-orange-500 font-bold flex items-center animate-bounce">
                <Check className="w-4 h-4 mr-1" /> Settings saved and targets re-calculated!
              </span>
            ) : (
              <span className="flex items-center"><Info className="w-3.5 h-3.5 mr-1" /> Re-calibrates TDEE using Mifflin St Jeor formulas.</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-xs"
            id="btn-save-settings"
          >
            <Save className="w-4 h-4" />
            <span>Save & Recalculate Target</span>
          </button>
        </div>
      </form>

      {/* Dangerous actions - hard reset */}
      <div className="bg-rose-500/10 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 space-y-4">
        <div className="flex items-start space-x-3 text-rose-800 dark:text-rose-300">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">App Memory Hard-Reset</h3>
            <p className="text-xs leading-relaxed mt-1">
              This action is destructive and irreversible. It instantly wipes your profile, logs history, water levels, streaks, and returns the application to the initial launching onboarding phase.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Are you absolutely sure you want to reset all data? This will clear logs and profile information permanently.")) {
              onHardReset();
            }
          }}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          id="btn-hard-reset"
        >
          Destructive Hard-Reset All Data
        </button>
      </div>

    </div>
  );
}
