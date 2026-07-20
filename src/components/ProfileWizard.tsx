/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Activity, Target, Settings, ArrowRight, ArrowLeft, 
  Sparkles, Heart, RefreshCw, AlertCircle, Dumbbell, Apple 
} from "lucide-react";
import { UserProfile, Gender, ActivityLevel, FitnessGoal, DietType } from "../types";

interface ProfileWizardProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export default function ProfileWizard({ onComplete, initialProfile }: ProfileWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile?.name || "");
  const [age, setAge] = useState<number>(initialProfile?.age || 26);
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || Gender.MALE);
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">(initialProfile?.heightUnit || "cm");
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.height || 175);
  const [weightKg, setWeightKg] = useState<number>(initialProfile?.weight || 72);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(initialProfile?.targetWeight || 68);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel || ActivityLevel.MODERATE
  );
  const [goal, setGoal] = useState<FitnessGoal>(initialProfile?.goal || FitnessGoal.LOSE_FAT);
  const [dietType, setDietType] = useState<DietType>(initialProfile?.dietType || DietType.NON_VEGETARIAN);

  // Height Conversion helper
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);

  const handleUnitToggle = (unit: "cm" | "ft") => {
    setHeightUnit(unit);
    if (unit === "ft") {
      const feet = Math.floor(heightCm / 30.48);
      const inches = Math.round((heightCm / 2.54) % 12);
      setHeightFt(feet);
      setHeightIn(inches);
    } else {
      const convertedCm = Math.round((heightFt * 30.48) + (heightIn * 2.54));
      setHeightCm(convertedCm);
    }
  };

  const getFinalHeightCm = () => {
    if (heightUnit === "ft") {
      return Math.round((heightFt * 30.48) + (heightIn * 2.54));
    }
    return heightCm;
  };

  const calculateResults = () => {
    const height = getFinalHeightCm();
    
    // 1. BMI Calculation
    const heightInMeters = height / 100;
    const bmi = Number((weightKg / (heightInMeters * heightInMeters)).toFixed(1));

    // 2. BMR (Mifflin St Jeor Formula)
    let bmr = 0;
    if (gender === Gender.MALE) {
      bmr = (10 * weightKg) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * height) - (5 * age) - 161;
    }
    bmr = Math.round(bmr);

    // 3. TDEE Calculation
    let activityMultiplier = 1.2;
    switch (activityLevel) {
      case ActivityLevel.SEDENTARY: activityMultiplier = 1.2; break;
      case ActivityLevel.LIGHT: activityMultiplier = 1.375; break;
      case ActivityLevel.MODERATE: activityMultiplier = 1.55; break;
      case ActivityLevel.ACTIVE: activityMultiplier = 1.725; break;
      case ActivityLevel.ATHLETE: activityMultiplier = 1.9; break;
    }
    const tdee = Math.round(bmr * activityMultiplier);

    // 4. Daily Calories based on Goal
    let dailyCalories = tdee;
    if (goal === FitnessGoal.LOSE_FAT) {
      dailyCalories = Math.max(1200, Math.round(tdee - 500)); // Standard healthy deficit
    } else if (goal === FitnessGoal.BUILD_MUSCLE) {
      dailyCalories = Math.round(tdee + 250); // Standard clean surplus
    } else if (goal === FitnessGoal.GAIN_WEIGHT) {
      dailyCalories = Math.round(tdee + 400); // Standard surplus
    }

    // 5. Macro Requirements
    // Protein: 2.0g/kg for fat loss/muscle build, 1.6g/kg for maintain/gain weight
    let proteinMultiplier = 1.6;
    if (goal === FitnessGoal.BUILD_MUSCLE || goal === FitnessGoal.LOSE_FAT) {
      proteinMultiplier = 2.0;
    }
    const proteinGoal = Math.round(weightKg * proteinMultiplier);

    // Fat: 25% of total calories (1g fat = 9 kcal)
    const fatGoal = Math.round((dailyCalories * 0.25) / 9);

    // Carbohydrates: Remaining calories (1g carb = 4 kcal)
    const proteinKcal = proteinGoal * 4;
    const fatKcal = fatGoal * 9;
    const carbGoal = Math.round(Math.max(50, (dailyCalories - proteinKcal - fatKcal) / 4));

    // Fiber Goal (g)
    const fiberGoal = gender === Gender.MALE ? 38 : 25;

    // Water Goal (ml)
    let waterGoal = 2500;
    if (activityLevel === ActivityLevel.MODERATE) waterGoal = 3000;
    if (activityLevel === ActivityLevel.ACTIVE || activityLevel === ActivityLevel.ATHLETE) waterGoal = 3500;
    if (goal === FitnessGoal.BUILD_MUSCLE) waterGoal += 500;

    return {
      name: name.trim() || "Buddy",
      age,
      gender,
      height,
      heightUnit,
      weight: weightKg,
      targetWeight: targetWeightKg,
      activityLevel,
      goal,
      dietType,
      isCalculated: true,
      bmi,
      bmr,
      tdee,
      dailyCalories,
      proteinGoal,
      carbGoal,
      fatGoal,
      fiberGoal,
      waterGoal
    };
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      const profile = calculateResults();
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  return (
    <div id="profile-wizard" className="w-full max-w-xl mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8">
      {/* Header and Step Indicators */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-orange-500 animate-pulse" />
          <span className="font-sans font-bold text-xl tracking-tight text-zinc-900 dark:text-white">DIETBUDDY Onboarding</span>
        </div>
        <div className="flex space-x-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step 
                  ? "w-6 bg-orange-500" 
                  : s < step 
                    ? "w-2 bg-orange-300 dark:bg-orange-800" 
                    : "w-2 bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.25 }}
          className="min-h-[340px] flex flex-col justify-between"
        >
          {/* STEP 1: Name, Age, Gender */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center">
                  <User className="w-6 h-6 mr-2 text-orange-500" /> Welcome to DietBuddy
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Let's calculate your personalized macro targets in seconds.</p>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Your First Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    id="input-name"
                  />
                </div>

                {/* Age & Gender Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Age (Years)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={age}
                      onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      id="input-age"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Gender</label>
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setGender(Gender.MALE)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          gender === Gender.MALE 
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm" 
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                        id="btn-gender-male"
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender(Gender.FEMALE)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          gender === Gender.FEMALE 
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm" 
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                        id="btn-gender-female"
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preferred Diet Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Dietary Preferences</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: DietType.NON_VEGETARIAN, label: "Non-Veg", desc: "Eggs, meat, dairy" },
                      { type: DietType.VEGETARIAN, label: "Vegetarian", desc: "No meat, dairy ok" },
                      { type: DietType.VEGAN, label: "Vegan", desc: "100% plant-based" }
                    ].map((d) => (
                      <button
                        key={d.type}
                        type="button"
                        onClick={() => setDietType(d.type)}
                        className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all flex flex-col justify-between h-20 ${
                          dietType === d.type
                            ? "bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-700 text-orange-900 dark:text-orange-300"
                            : "bg-zinc-50/50 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                        id={`btn-diet-${d.type}`}
                      >
                        <span>{d.label}</span>
                        <span className="text-[10px] text-zinc-400 font-normal leading-tight">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Height, Weight, Target Weight */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-orange-500" /> Body Metrics
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Used for energy expenditure equations and BMR scaling.</p>
              </div>

              <div className="space-y-4">
                {/* Height Row with units toggler */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Height</label>
                    <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleUnitToggle("cm")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                          heightUnit === "cm" 
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs" 
                            : "text-zinc-500"
                        }`}
                        id="height-unit-cm"
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitToggle("ft")}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                          heightUnit === "ft" 
                            ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-xs" 
                            : "text-zinc-500"
                        }`}
                        id="height-unit-ft"
                      >
                        ft/in
                      </button>
                    </div>
                  </div>

                  {heightUnit === "cm" ? (
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="100"
                        max="220"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseInt(e.target.value))}
                        className="flex-1 accent-orange-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        id="height-slider"
                      />
                      <span className="font-mono text-lg font-bold w-16 text-right text-zinc-900 dark:text-white">{heightCm} cm</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
                        <span className="text-xs text-zinc-400 font-bold">Feet:</span>
                        <input
                          type="number"
                          min="3"
                          max="8"
                          value={heightFt}
                          onChange={(e) => setHeightFt(parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent border-none text-right font-bold focus:ring-0 text-zinc-900 dark:text-white"
                          id="height-feet-input"
                        />
                      </div>
                      <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
                        <span className="text-xs text-zinc-400 font-bold">Inches:</span>
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={heightIn}
                          onChange={(e) => setHeightIn(parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent border-none text-right font-bold focus:ring-0 text-zinc-900 dark:text-white"
                          id="height-inches-input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Weight Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Current Weight</label>
                    <span className="font-mono text-lg font-bold text-orange-500">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="180"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    id="weight-slider"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>35 kg</span>
                    <span>107 kg (Avg)</span>
                    <span>180 kg</span>
                  </div>
                </div>

                {/* Target Weight Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Target Weight Goal</label>
                    <span className="font-mono text-lg font-bold text-orange-500">{targetWeightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="180"
                    step="0.5"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    id="target-weight-slider"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>35 kg</span>
                    <span>Same as current ({weightKg} kg)</span>
                    <span>180 kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Activity Level */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-orange-500" /> Daily Activity Level
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total daily energy expenditure (TDEE) scales directly with your activity multiplier.</p>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {[
                  {
                    level: ActivityLevel.SEDENTARY,
                    title: "Sedentary",
                    desc: "Desk job, little to no weekly structured exercise.",
                    mult: "1.2x"
                  },
                  {
                    level: ActivityLevel.LIGHT,
                    title: "Light Activity",
                    desc: "Light exercise / sports 1-3 days per week.",
                    mult: "1.375x"
                  },
                  {
                    level: ActivityLevel.MODERATE,
                    title: "Moderate Activity",
                    desc: "Intense exercise / training 3-5 days per week.",
                    mult: "1.55x"
                  },
                  {
                    level: ActivityLevel.ACTIVE,
                    title: "Heavy Active",
                    desc: "Hard training / heavy sports 6-7 days per week.",
                    mult: "1.725x"
                  },
                  {
                    level: ActivityLevel.ATHLETE,
                    title: "Elite Athlete",
                    desc: "Professional training twice daily, or high physical job.",
                    mult: "1.9x"
                  }
                ].map((act) => (
                  <button
                    key={act.level}
                    type="button"
                    onClick={() => setActivityLevel(act.level)}
                    className={`w-full p-3.5 text-left rounded-xl border flex items-center justify-between transition-all ${
                      activityLevel === act.level
                        ? "bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-700 text-orange-900 dark:text-orange-300 shadow-sm"
                        : "bg-zinc-50/50 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                    id={`btn-activity-${act.level}`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{act.title}</div>
                      <div className="text-[11px] text-zinc-400 leading-tight pr-4">{act.desc}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 px-2.5 py-1 rounded-md">{act.mult}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Fitness Goal */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center">
                  <Target className="w-6 h-6 mr-2 text-orange-500" /> Primary Fitness Goal
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">DietBuddy configures calorie surplus or deficit offsets according to your bio-goal.</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  {
                    goalType: FitnessGoal.LOSE_FAT,
                    title: "Lose Body Fat",
                    desc: "Creates a calorie deficit (~20% below TDEE) to trigger lipid burning while protecting protein synthesis.",
                    icon: Apple,
                    color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20"
                  },
                  {
                    goalType: FitnessGoal.BUILD_MUSCLE,
                    title: "Build Muscle",
                    desc: "Clean anabolic surplus (+250 kcal TDEE offset) paired with elevated protein targets for hypertrophic growth.",
                    icon: Dumbbell,
                    color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  },
                  {
                    goalType: FitnessGoal.MAINTAIN,
                    title: "Maintain Weight",
                    desc: "Recreational equilibrium (exact TDEE caloric match) to hold cellular body composition constant.",
                    icon: Sparkles,
                    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  },
                  {
                    goalType: FitnessGoal.GAIN_WEIGHT,
                    title: "Gain Weight",
                    desc: "Strong caloric surplus (+400 kcal offset) aimed at quick mass development and metabolic energy density.",
                    icon: Heart,
                    color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20"
                  }
                ].map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.goalType}
                      type="button"
                      onClick={() => setGoal(g.goalType)}
                      className={`p-4 text-left rounded-2xl border flex flex-col justify-between transition-all h-[155px] ${
                        goal === g.goalType
                          ? "bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-700 text-orange-900 dark:text-orange-300 shadow-md"
                          : "bg-zinc-50/50 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                      id={`btn-goal-${g.goalType}`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs font-bold leading-none mt-1">{g.title}</span>
                        <div className={`p-1.5 rounded-lg ${g.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-normal">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
                id="btn-back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md ${
                isStepValid()
                  ? "bg-orange-500 hover:bg-orange-600 active:scale-95 cursor-pointer"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none"
              }`}
              id="btn-next"
            >
              <span>{step === 4 ? "Calculate Requirements" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
