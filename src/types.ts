/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export enum ActivityLevel {
  SEDENTARY = "SEDENTARY", // Little to no exercise
  LIGHT = "LIGHT",         // 1-3 days/week
  MODERATE = "MODERATE",   // 3-5 days/week
  ACTIVE = "ACTIVE",       // 6-7 days/week
  ATHLETE = "ATHLETE"      // Heavy exercise/physical job
}

export enum FitnessGoal {
  LOSE_FAT = "LOSE_FAT",
  BUILD_MUSCLE = "BUILD_MUSCLE",
  MAINTAIN = "MAINTAIN",
  GAIN_WEIGHT = "GAIN_WEIGHT"
}

export enum DietType {
  VEGETARIAN = "VEGETARIAN",
  VEGAN = "VEGAN",
  NON_VEGETARIAN = "NON_VEGETARIAN"
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  heightUnit: "cm" | "ft";
  weight: number; // in kg
  targetWeight: number; // in kg
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  dietType: DietType;
  isCalculated: boolean;
  
  // Calculated stats
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinGoal: number; // g
  carbGoal: number;    // g
  fatGoal: number;     // g
  fiberGoal: number;   // g
  waterGoal: number;   // ml
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;     // kcal per 100g
  protein: number;      // g per 100g
  carbs: number;        // g per 100g
  fat: number;          // g per 100g
  fiber: number;        // g per 100g
  sugar?: number;       // g per 100g
  sodium?: number;      // mg per 100g
  calcium?: number;     // mg per 100g
  iron?: number;        // mg per 100g
  potassium?: number;   // mg per 100g
  vitC?: number;        // mg per 100g
  vitD?: number;        // mcg per 100g
  vitB12?: number;      // mcg per 100g
  servingSizeGrams: number; // Default single serving size in grams
  servingUnitName: string;   // e.g. "bowl", "slice", "scoop", "100g"
  isCustom?: boolean;
}

export type MealTime = "Breakfast" | "Lunch" | "Snacks" | "Dinner";

export interface LogEntry {
  id: string;
  foodId: string;
  name: string;
  calories: number;     // Total in this entry
  protein: number;      // Total in this entry
  carbs: number;        // Total in this entry
  fat: number;          // Total in this entry
  fiber: number;        // Total in this entry
  sugar: number;
  sodium: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitC: number;
  vitD: number;
  vitB12: number;
  weightGrams: number;  // Logged weight
  timeOfDay: MealTime;
  timestamp: number;    // Date-time recorded
}

export interface WeightEntry {
  id: string;
  date: string;         // YYYY-MM-DD
  weight: number;       // kg
  bmi: number;
  bodyFatEstimate: number; // estimated percentage
  timestamp: number;
}

export interface CustomMealIngredient {
  foodId: string;
  name: string;
  weightGrams: number;
}

export interface CustomMeal {
  id: string;
  name: string;
  ingredients: CustomMealIngredient[];
  calories: number;     // Total meal calories
  protein: number;      // Total meal protein
  carbs: number;        // Total meal carbs
  fat: number;          // Total meal fat
  fiber: number;        // Total meal fiber
  sugar: number;
  sodium: number;
}

export interface FavoriteShake {
  id: string;
  name: string;
  milkType: string;
  milkAmountMl: number;
  proteinType: string;
  proteinGrams: number;
  bananaCount: number;
  pbGrams: number;
  flaxGrams: number;
  pumpkinGrams: number;
  chiaGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DailyLog {
  date: string;          // YYYY-MM-DD
  entries: LogEntry[];
  waterDrankMl: number;  // Current water intake in ml
}

export interface Reminder {
  id: string;
  title: string;
  time: string;          // HH:MM
  enabled: boolean;
  type: "water" | "protein" | "meal" | "weight";
}
