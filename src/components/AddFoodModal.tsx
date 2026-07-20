/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Mic, X, Plus, Sparkles, Star, Clock, Info, 
  Dumbbell, Apple, Salad, HelpCircle, Check, Trash2, Sliders, Play, Square 
} from "lucide-react";
import { FoodItem, LogEntry, MealTime, CustomMeal, FavoriteShake, CustomMealIngredient } from "../types";
import { COMMON_FOOD_DATABASE } from "../data/foods";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  mealTime: MealTime;
  recentEntries: LogEntry[];
  favoriteMeals: CustomMeal[];
  favoriteShakes: FavoriteShake[];
  onSaveCustomMeal: (meal: CustomMeal) => void;
  onSaveFavoriteShake: (shake: FavoriteShake) => void;
}

export default function AddFoodModal({
  isOpen,
  onClose,
  onAddLog,
  mealTime,
  recentEntries,
  favoriteMeals,
  favoriteShakes,
  onSaveCustomMeal,
  onSaveFavoriteShake
}: AddFoodModalProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"search" | "custom-meal" | "shake-builder" | "manual">("search");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "protein" | "fiber" | "low-cal">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionSizeGrams, setPortionSizeGrams] = useState<number>(100);

  // Manual Food Entry state
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [manualProtein, setManualProtein] = useState<number>(0);
  const [manualCarbs, setManualCarbs] = useState<number>(0);
  const [manualFat, setManualFat] = useState<number>(0);
  const [manualFiber, setManualFiber] = useState<number>(0);

  // Custom Meal state
  const [customMealName, setCustomMealName] = useState("");
  const [mealIngredients, setMealIngredients] = useState<CustomMealIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [ingredientWeightGrams, setIngredientWeightGrams] = useState<number>(100);

  // Protein Shake state
  const [shakeName, setShakeName] = useState("My Gym Protein Shake");
  const [shakeMilkType, setShakeMilkType] = useState("cow_milk_whole");
  const [shakeMilkMl, setShakeMilkMl] = useState<number>(250);
  const [shakeProteinType, setShakeProteinType] = useState("whey_protein");
  const [shakeProteinGrams, setShakeProteinGrams] = useState<number>(33);
  const [shakeBananaCount, setShakeBananaCount] = useState<number>(1);
  const [shakePbGrams, setShakePbGrams] = useState<number>(16);
  const [shakeFlaxGrams, setShakeFlaxGrams] = useState<number>(5);
  const [shakePumpkinGrams, setShakePumpkinGrams] = useState<number>(5);
  const [shakeChiaGrams, setShakeChiaGrams] = useState<number>(5);

  // Voice recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");

  const categories = ["all", ...Array.from(new Set(COMMON_FOOD_DATABASE.map(f => f.category)))];

  // Speech Recognition setup (Web Speech API)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsRecording(true);
          setVoiceStatus("Listening for food and quantities... e.g., '150g basmati rice and 100g curd'");
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceText(transcript);
          setIsRecording(false);
          setVoiceStatus("Voice captured!");
          processVoiceInput(transcript);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          setVoiceStatus(`Speech error: ${event.error}. Try searching manually.`);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const startVoiceRecording = () => {
    if (recognitionRef.current) {
      setVoiceText("");
      recognitionRef.current.start();
    } else {
      setVoiceStatus("Web Speech API is not supported in this browser. Try entering voice commands below:");
      setIsRecording(true); // simulated voice helper panel
    }
  };

  const handleSimulatedVoiceText = (text: string) => {
    setVoiceText(text);
    setIsRecording(false);
    processVoiceInput(text);
  };

  // Basic NLP Parser for Voice inputs
  const processVoiceInput = (text: string) => {
    const query = text.toLowerCase();
    
    // Look for common quantities (grams, pieces)
    let parsedGrams = 100;
    const gMatch = query.match(/(\d+)\s*g/);
    if (gMatch) {
      parsedGrams = parseInt(gMatch[1]);
    } else {
      const mlMatch = query.match(/(\d+)\s*ml/);
      if (mlMatch) parsedGrams = parseInt(mlMatch[1]);
    }

    // Try to match a food in database
    let bestMatch: FoodItem | null = null;
    let highestScore = 0;

    for (const food of COMMON_FOOD_DATABASE) {
      const foodName = food.name.toLowerCase();
      // Calculate basic intersection score
      const queryWords = query.split(/\s+/);
      let matchCount = 0;
      queryWords.forEach(word => {
        if (word.length > 2 && foodName.includes(word)) {
          matchCount++;
        }
      });

      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestMatch = food;
      }
    }

    if (bestMatch) {
      setSelectedFood(bestMatch);
      setPortionSizeGrams(parsedGrams);
      setSearchQuery(bestMatch.name);
      setVoiceStatus(`Matched "${bestMatch.name}" at ${parsedGrams}g!`);
    } else {
      setVoiceStatus(`Couldn't identify exact food. Showing results for search...`);
      setSearchQuery(text);
    }
  };

  // Filter food database based on search input, category, and protein/fiber/low-cal presets
  const filteredDatabase = COMMON_FOOD_DATABASE.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          food.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || food.category === selectedCategory;

    let matchesPreset = true;
    if (selectedFilter === "protein") {
      matchesPreset = food.protein >= 15; // Protein rich (>15g per 100g)
    } else if (selectedFilter === "fiber") {
      matchesPreset = food.fiber >= 5; // Fiber rich (>5g per 100g)
    } else if (selectedFilter === "low-cal") {
      matchesPreset = food.calories < 100; // Low calorie (<100 kcal per 100g)
    }

    return matchesSearch && matchesCategory && matchesPreset;
  });

  const selectFoodItem = (food: FoodItem) => {
    setSelectedFood(food);
    setPortionSizeGrams(food.servingSizeGrams);
  };

  const calculateMacroForPortion = (valuePer100g: number | undefined) => {
    if (valuePer100g === undefined) return 0;
    return Number(((valuePer100g * portionSizeGrams) / 100).toFixed(1));
  };

  const handleAddLoggedFood = () => {
    if (!selectedFood) return;

    onAddLog({
      foodId: selectedFood.id,
      name: selectedFood.name,
      calories: calculateMacroForPortion(selectedFood.calories),
      protein: calculateMacroForPortion(selectedFood.protein),
      carbs: calculateMacroForPortion(selectedFood.carbs),
      fat: calculateMacroForPortion(selectedFood.fat),
      fiber: calculateMacroForPortion(selectedFood.fiber),
      sugar: calculateMacroForPortion(selectedFood.sugar || 0),
      sodium: calculateMacroForPortion(selectedFood.sodium || 0),
      calcium: calculateMacroForPortion(selectedFood.calcium || 0),
      iron: calculateMacroForPortion(selectedFood.iron || 0),
      potassium: calculateMacroForPortion(selectedFood.potassium || 0),
      vitC: calculateMacroForPortion(selectedFood.vitC || 0),
      vitD: calculateMacroForPortion(selectedFood.vitD || 0),
      vitB12: calculateMacroForPortion(selectedFood.vitB12 || 0),
      weightGrams: portionSizeGrams,
      timeOfDay: mealTime
    });

    onClose();
    resetModal();
  };

  const handleAddManualFood = () => {
    if (!manualName.trim()) return;

    onAddLog({
      foodId: "manual_" + Date.now(),
      name: manualName.trim(),
      calories: manualCalories,
      protein: manualProtein,
      carbs: manualCarbs,
      fat: manualFat,
      fiber: manualFiber,
      sugar: 0,
      sodium: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      vitC: 0,
      vitD: 0,
      vitB12: 0,
      weightGrams: 100,
      timeOfDay: mealTime
    });

    onClose();
    resetModal();
  };

  const resetModal = () => {
    setSearchQuery("");
    setSelectedFood(null);
    setSelectedFilter("all");
    setSelectedCategory("all");
    setPortionSizeGrams(100);
    setManualName("");
    setManualCalories(0);
    setManualProtein(0);
    setManualCarbs(0);
    setManualFat(0);
    setManualFiber(0);
    setMealIngredients([]);
    setCustomMealName("");
    setIsRecording(false);
    setVoiceText("");
    setVoiceStatus("");
  };

  // --- CUSTOM MEAL BUILDER HANDLERS ---
  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;
    const food = COMMON_FOOD_DATABASE.find(f => f.id === selectedIngredientId);
    if (!food) return;

    const existing = mealIngredients.find(i => i.foodId === selectedIngredientId);
    if (existing) {
      setMealIngredients(mealIngredients.map(i => 
        i.foodId === selectedIngredientId 
          ? { ...i, weightGrams: i.weightGrams + ingredientWeightGrams }
          : i
      ));
    } else {
      setMealIngredients([...mealIngredients, {
        foodId: food.id,
        name: food.name,
        weightGrams: ingredientWeightGrams
      }]);
    }
    setSelectedIngredientId("");
    setIngredientWeightGrams(100);
  };

  const handleRemoveIngredient = (foodId: string) => {
    setMealIngredients(mealIngredients.filter(i => i.foodId !== foodId));
  };

  const getCustomMealTotals = () => {
    return mealIngredients.reduce((acc, curr) => {
      const food = COMMON_FOOD_DATABASE.find(f => f.id === curr.foodId);
      if (!food) return acc;
      const scale = curr.weightGrams / 100;
      acc.calories += (food.calories * scale);
      acc.protein += (food.protein * scale);
      acc.carbs += (food.carbs * scale);
      acc.fat += (food.fat * scale);
      acc.fiber += (food.fiber * scale);
      acc.sugar += ((food.sugar || 0) * scale);
      acc.sodium += ((food.sodium || 0) * scale);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
  };

  const handleSaveAndLogCustomMeal = () => {
    if (!customMealName.trim() || mealIngredients.length === 0) return;
    const totals = getCustomMealTotals();

    const customMeal: CustomMeal = {
      id: "custom_meal_" + Date.now(),
      name: customMealName.trim(),
      ingredients: mealIngredients,
      calories: Math.round(totals.calories),
      protein: Number(totals.protein.toFixed(1)),
      carbs: Number(totals.carbs.toFixed(1)),
      fat: Number(totals.fat.toFixed(1)),
      fiber: Number(totals.fiber.toFixed(1)),
      sugar: Number(totals.sugar.toFixed(1)),
      sodium: Math.round(totals.sodium)
    };

    onSaveCustomMeal(customMeal);

    onAddLog({
      foodId: customMeal.id,
      name: customMeal.name,
      calories: customMeal.calories,
      protein: customMeal.protein,
      carbs: customMeal.carbs,
      fat: customMeal.fat,
      fiber: customMeal.fiber,
      sugar: customMeal.sugar,
      sodium: customMeal.sodium,
      calcium: 0, iron: 0, potassium: 0, vitC: 0, vitD: 0, vitB12: 0,
      weightGrams: mealIngredients.reduce((sum, i) => sum + i.weightGrams, 0),
      timeOfDay: mealTime
    });

    onClose();
    resetModal();
  };

  const handleLogCustomMealDirect = (meal: CustomMeal) => {
    onAddLog({
      foodId: meal.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      sugar: meal.sugar,
      sodium: meal.sodium,
      calcium: 0, iron: 0, potassium: 0, vitC: 0, vitD: 0, vitB12: 0,
      weightGrams: meal.ingredients.reduce((sum, i) => sum + i.weightGrams, 0),
      timeOfDay: mealTime
    });
    onClose();
  };

  // --- PROTEIN SHAKE BUILDER CALCULATORS ---
  const getShakeTotals = () => {
    // Milk component
    const milk = COMMON_FOOD_DATABASE.find(f => f.id === shakeMilkType) || COMMON_FOOD_DATABASE[0];
    const milkScale = shakeMilkMl / 100;

    // Protein powder component
    const protein = COMMON_FOOD_DATABASE.find(f => f.id === shakeProteinType) || COMMON_FOOD_DATABASE[0];
    const proteinScale = shakeProteinGrams / 100;

    // Optional ingredients
    const banana = COMMON_FOOD_DATABASE.find(f => f.id === "banana")!;
    const bananaScale = (shakeBananaCount * 120) / 100; // 1 banana ~120g

    const pb = COMMON_FOOD_DATABASE.find(f => f.id === "peanut_butter")!;
    const pbScale = shakePbGrams / 100;

    const flax = COMMON_FOOD_DATABASE.find(f => f.id === "flax_seeds")!;
    const flaxScale = shakeFlaxGrams / 100;

    const pumpkin = COMMON_FOOD_DATABASE.find(f => f.id === "pumpkin_seeds")!;
    const pumpkinScale = shakePumpkinGrams / 100;

    const chia = COMMON_FOOD_DATABASE.find(f => f.id === "chia_seeds")!;
    const chiaScale = shakeChiaGrams / 100;

    const ingredientsToSum = [
      { food: milk, scale: milkScale },
      { food: protein, scale: proteinScale },
      { food: banana, scale: bananaScale },
      { food: pb, scale: pbScale },
      { food: flax, scale: flaxScale },
      { food: pumpkin, scale: pumpkinScale },
      { food: chia, scale: chiaScale }
    ];

    return ingredientsToSum.reduce((acc, item) => {
      if (!item.food) return acc;
      acc.calories += (item.food.calories * item.scale);
      acc.protein += (item.food.protein * item.scale);
      acc.carbs += (item.food.carbs * item.scale);
      acc.fat += (item.food.fat * item.scale);
      acc.fiber += (item.food.fiber * item.scale);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const handleSaveAndLogShake = () => {
    const totals = getShakeTotals();

    const shake: FavoriteShake = {
      id: "shake_" + Date.now(),
      name: shakeName.trim() || "My Gym Shake",
      milkType: shakeMilkType,
      milkAmountMl: shakeMilkMl,
      proteinType: shakeProteinType,
      proteinGrams: shakeProteinGrams,
      bananaCount: shakeBananaCount,
      pbGrams: shakePbGrams,
      flaxGrams: shakeFlaxGrams,
      pumpkinGrams: shakePumpkinGrams,
      chiaGrams: shakeChiaGrams,
      calories: Math.round(totals.calories),
      protein: Number(totals.protein.toFixed(1)),
      carbs: Number(totals.carbs.toFixed(1)),
      fat: Number(totals.fat.toFixed(1)),
      fiber: Number(totals.fiber.toFixed(1))
    };

    onSaveFavoriteShake(shake);

    onAddLog({
      foodId: shake.id,
      name: shake.name,
      calories: shake.calories,
      protein: shake.protein,
      carbs: shake.carbs,
      fat: shake.fat,
      fiber: shake.fiber,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, potassium: 0, vitC: 0, vitD: 0, vitB12: 0,
      weightGrams: shakeMilkMl + shakeProteinGrams + (shakeBananaCount * 120) + shakePbGrams + shakeFlaxGrams + shakePumpkinGrams + shakeChiaGrams,
      timeOfDay: mealTime
    });

    onClose();
    resetModal();
  };

  const handleLogShakeDirect = (shake: FavoriteShake) => {
    onAddLog({
      foodId: shake.id,
      name: shake.name,
      calories: shake.calories,
      protein: shake.protein,
      carbs: shake.carbs,
      fat: shake.fat,
      fiber: shake.fiber,
      sugar: 0, sodium: 0, calcium: 0, iron: 0, potassium: 0, vitC: 0, vitD: 0, vitB12: 0,
      weightGrams: shake.milkAmountMl + shake.proteinGrams + (shake.bananaCount * 120) + shake.pbGrams + shake.flaxGrams + shake.pumpkinGrams + shake.chiaGrams,
      timeOfDay: mealTime
    });
    onClose();
  };

  const shakeTotals = getShakeTotals();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/45 backdrop-blur-md"
          id="modal-backdrop"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl h-[88vh] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          id="modal-add-food"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 font-sans">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
                  {mealTime}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600 font-bold">•</span>
                <h3 className="text-lg font-display font-semibold text-zinc-900 dark:text-white">Add Foods</h3>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Enter your consumed nutrition instantly.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voice Rec Button */}
              <button
                type="button"
                onClick={startVoiceRecording}
                className={`p-2.5 rounded-full border transition-all relative ${
                  isRecording 
                    ? "bg-rose-50 border-rose-300 text-rose-500 animate-pulse" 
                    : "bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                }`}
                title="Voice Input"
                id="btn-voice-rec"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer"
                id="btn-close-modal"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Voice Input capture notification panel */}
          {isRecording && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/40 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="text-xs text-orange-800 dark:text-orange-300 font-medium font-sans">
                  {voiceStatus || "Listening closely..."}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleSimulatedVoiceText("150g basmati rice and 100g paneer")}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-600 text-white rounded-md"
                >
                  Simulate: Rice & Paneer
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  className="p-1 text-orange-700 hover:text-orange-900 dark:text-orange-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 bg-zinc-50/20 dark:bg-zinc-900/20">
            {[
              { id: "search", label: "Search Database" },
              { id: "custom-meal", label: "Custom Meal Builder" },
              { id: "shake-builder", label: "Protein Shake Builder" },
              { id: "manual", label: "Quick Manual Entry" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id as any); setSelectedFood(null); }}
                className={`py-3.5 px-4 font-sans text-xs font-semibold border-b-2 -mb-px transition-all ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600 dark:text-orange-400 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
                id={`tab-add-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content Pane */}
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SEARCH TAB */}
            {activeTab === "search" && (
              <>
                {/* Left pane: Search filters & matches */}
                <div className="lg:col-span-7 flex flex-col space-y-4 font-sans">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search basmati rice, eggs, whey, dal, paneer, oats..."
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      id="search-food-input"
                    />
                  </div>

                  {/* Built-in Smart Filters */}
                  <div className="flex flex-wrap gap-1.5 font-sans">
                    {[
                      { filter: "all", label: "All Foods", icon: Salad },
                      { filter: "protein", label: "Protein Rich (15g+)", icon: Dumbbell },
                      { filter: "fiber", label: "Fiber Rich (5g+)", icon: Salad },
                      { filter: "low-cal", label: "Low Cal (<100)", icon: Apple }
                    ].map(f => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.filter}
                          type="button"
                          onClick={() => setSelectedFilter(f.filter as any)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 border transition-all ${
                            selectedFilter === f.filter
                              ? "bg-orange-500 border-orange-500 text-white shadow-xs"
                              : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Category filters list */}
                  <div className="flex space-x-1 overflow-x-auto pb-1.5 max-w-full">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap uppercase tracking-wider capitalize transition-all ${
                          selectedCategory === cat
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {cat === "all" ? "All Categories" : cat}
                      </button>
                    ))}
                  </div>

                  {/* Matches List */}
                  <div className="flex-1 min-h-[220px] max-h-[350px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2 space-y-1 bg-zinc-50/20">
                    {filteredDatabase.length > 0 ? (
                      filteredDatabase.map(food => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => selectFoodItem(food)}
                          className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                            selectedFood?.id === food.id
                              ? "bg-orange-50 border border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/30 text-orange-900 dark:text-orange-300"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-transparent"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold font-sans">{food.name}</div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                              {food.category} • {food.calories} kcal/100g • Pro: {food.protein}g • Carbs: {food.carbs}g • Fat: {food.fat}g
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-1.5 font-mono text-xs text-zinc-400">
                            <span>100g</span>
                            <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <Salad className="w-8 h-8 opacity-40 mb-2 text-zinc-400" />
                        <span className="text-xs font-semibold">No foods match search keywords</span>
                      </div>
                    )}
                  </div>

                  {/* Recents & Custom Meals shortcut lists */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Favorites & Recents</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Recents list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> Recently Logged</span>
                        <div className="max-h-[110px] overflow-y-auto space-y-1">
                          {recentEntries.slice(0, 3).map((r, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                      const found = COMMON_FOOD_DATABASE.find(f => f.id === r.foodId);
                                      if (found) selectFoodItem(found);
                              }}
                              className="w-full text-left p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] truncate block text-zinc-600 dark:text-zinc-300"
                            >
                              {r.name} ({r.weightGrams}g)
                            </button>
                          ))}
                          {recentEntries.length === 0 && <span className="text-[10px] text-zinc-400 block italic">No recent foods.</span>}
                        </div>
                      </div>

                      {/* Saved Custom Meals list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center"><Star className="w-3 h-3 mr-1" /> Custom Meals</span>
                        <div className="max-h-[110px] overflow-y-auto space-y-1">
                          {favoriteMeals.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-[10px] p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">
                              <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate pr-1">{m.name}</span>
                              <button
                                type="button"
                                onClick={() => handleLogCustomMealDirect(m)}
                                className="text-orange-500 hover:text-orange-600 font-bold hover:underline"
                              >
                                Log
                              </button>
                            </div>
                          ))}
                          {favoriteShakes.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-[10px] p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">
                              <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate pr-1">🥤 {s.name}</span>
                              <button
                                type="button"
                                onClick={() => handleLogShakeDirect(s)}
                                className="text-orange-500 hover:text-orange-600 font-bold hover:underline"
                              >
                                Log
                              </button>
                            </div>
                          ))}
                          {favoriteMeals.length === 0 && favoriteShakes.length === 0 && (
                            <span className="text-[10px] text-zinc-400 block italic">No saved meals/shakes.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right pane: Portion adjuster & instant micro dashboard */}
                <div className="lg:col-span-5 border-l border-zinc-100 dark:border-zinc-800 lg:pl-6 flex flex-col justify-between font-sans">
                  {selectedFood ? (
                    <div className="space-y-5 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                          <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">{selectedFood.category}</span>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white mt-1 leading-tight">{selectedFood.name}</h4>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Default: 100g = {selectedFood.calories} kcal</p>
                        </div>

                        {/* Portion Size Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Portion Weight</label>
                            <span className="font-mono text-lg font-extrabold text-orange-500">{portionSizeGrams} g</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="800"
                            step="5"
                            value={portionSizeGrams}
                            onChange={(e) => setPortionSizeGrams(parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                            <span>10g</span>
                            <span>{selectedFood.servingSizeGrams}g ({selectedFood.servingUnitName})</span>
                            <span>800g</span>
                          </div>
                        </div>

                        {/* Nutrition breakdown of current portion */}
                        <div className="space-y-2 pt-2">
                          <h5 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Portion Nutrition Dashboard</h5>
                          
                          {/* Calories Hero Card */}
                          <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Calories</span>
                            <span className="font-mono text-base font-bold text-zinc-900 dark:text-white">{calculateMacroForPortion(selectedFood.calories)} kcal</span>
                          </div>

                          {/* Major Macros Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Protein</span>
                              <div className="font-mono text-sm font-bold text-rose-700 dark:text-rose-300 mt-1">{calculateMacroForPortion(selectedFood.protein)}g</div>
                            </div>
                            <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Carbs</span>
                              <div className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300 mt-1">{calculateMacroForPortion(selectedFood.carbs)}g</div>
                            </div>
                            <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Fat</span>
                              <div className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">{calculateMacroForPortion(selectedFood.fat)}g</div>
                            </div>
                          </div>

                          {/* Minor Macros / Micros list */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-500">Dietary Fiber</span>
                              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{calculateMacroForPortion(selectedFood.fiber)} g</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-500">Sugar Content</span>
                              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{calculateMacroForPortion(selectedFood.sugar || 0)} g</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-500">Sodium (Salt)</span>
                              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{calculateMacroForPortion(selectedFood.sodium || 0)} mg</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Log portion CTA */}
                      <button
                        type="button"
                        onClick={handleAddLoggedFood}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg flex items-center justify-center space-x-1.5 active:scale-98 cursor-pointer"
                        id="btn-log-food-portion"
                      >
                        <Check className="w-4 h-4" />
                        <span>Log {portionSizeGrams}g to {mealTime}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-400 text-center px-4">
                      <Info className="w-8 h-8 opacity-30 text-orange-500 mb-2" />
                      <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">No food selected</span>
                      <p className="text-xs text-zinc-400 mt-1 leading-normal max-w-[240px]">Select a food from the left list to scale portions and log its nutrition.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* CUSTOM MEAL BUILDER TAB */}
            {activeTab === "custom-meal" && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                
                {/* Left col: Add ingredients */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Custom Meal Name</label>
                      <input
                        type="text"
                        value={customMealName}
                        onChange={(e) => setCustomMealName(e.target.value)}
                        placeholder="e.g. Soya Chunks + High Protein Curd"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-950 dark:text-white"
                        id="custom-meal-name"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Ingredient</label>
                        <select
                          value={selectedIngredientId}
                          onChange={(e) => setSelectedIngredientId(e.target.value)}
                          className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-white"
                          id="ingredient-select"
                        >
                          <option value="">-- Choose Food --</option>
                          {COMMON_FOOD_DATABASE.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Weight</label>
                        <input
                          type="number"
                          value={ingredientWeightGrams}
                          onChange={(e) => setIngredientWeightGrams(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-center font-bold"
                          id="ingredient-weight"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      disabled={!selectedIngredientId}
                      className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 border"
                      id="btn-add-ingredient"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Ingredient Component</span>
                    </button>
                  </div>

                  {/* Saved Ingredients listed */}
                  <div className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto border rounded-xl p-3 bg-zinc-50/10 space-y-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Ingredients added</span>
                    {mealIngredients.map((ing) => (
                      <div key={ing.foodId} className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{ing.name}</span>
                          <span className="text-[10px] text-zinc-400 block">{ing.weightGrams}g Portion</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.foodId)}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {mealIngredients.length === 0 && (
                      <div className="flex justify-center items-center h-24 text-zinc-400 text-xs italic">
                        No ingredients in custom meal yet.
                      </div>
                    )}
                  </div>
                </div>
                {/* Right col: Custom Meal macros totals & logging */}
                <div className="border-l border-zinc-100 dark:border-zinc-800 pl-0 md:pl-6 flex flex-col justify-between font-sans">
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Meal Macro Aggregation</span>
                      <div className="font-mono text-3xl font-extrabold text-orange-500 mt-2">{Math.round(getCustomMealTotals().calories)} kcal</div>
                      <p className="text-[11px] text-zinc-400 mt-1">Summation of {mealIngredients.length} active ingredients.</p>
                    </div>

                    {/* Macro totals Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Protein", val: `${getCustomMealTotals().protein.toFixed(1)}g`, color: "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-300" },
                        { label: "Carbs", val: `${getCustomMealTotals().carbs.toFixed(1)}g`, color: "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/10 dark:border-blue-900/30 dark:text-blue-300" },
                        { label: "Fat", val: `${getCustomMealTotals().fat.toFixed(1)}g`, color: "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-300" },
                        { label: "Fiber", val: `${getCustomMealTotals().fiber.toFixed(1)}g`, color: "bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-950/10 dark:border-orange-900/30 dark:text-orange-300" }
                      ].map((macro) => (
                        <div key={macro.label} className={`p-2 rounded-xl border ${macro.color}`}>
                          <span className="text-[9px] font-bold uppercase block">{macro.label}</span>
                          <span className="font-mono text-xs font-extrabold mt-1 block">{macro.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAndLogCustomMeal}
                    disabled={!customMealName.trim() || mealIngredients.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg flex items-center justify-center space-x-1.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    id="btn-save-log-custom-meal"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Meal & Log to {mealTime}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PROTEIN SHAKE BUILDER TAB */}
            {activeTab === "shake-builder" && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                
                {/* Left col: Shake configurations */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Shake Creator Name</label>
                    <input
                      type="text"
                      value={shakeName}
                      onChange={(e) => setShakeName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-xs font-bold text-zinc-900 dark:text-white"
                      id="shake-creator-name"
                    />
                  </div>

                  {/* 1. Liquid Base */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-2 border">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">1. Liquid Base</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={shakeMilkType}
                        onChange={(e) => setShakeMilkType(e.target.value)}
                        className="p-2 bg-white dark:bg-zinc-800 border rounded-lg text-xs"
                      >
                        <option value="cow_milk_whole">Whole Cow Milk</option>
                        <option value="cow_milk_skimmed">Skimmed Cow Milk</option>
                      </select>
                      <div className="flex items-center space-x-1.5 border rounded-lg p-1.5 bg-white dark:bg-zinc-800">
                        <input
                          type="number"
                          value={shakeMilkMl}
                          onChange={(e) => setShakeMilkMl(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-transparent border-none text-right font-bold text-xs"
                        />
                        <span className="text-xs text-zinc-400">ml</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Protein Source */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-2 border">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">2. Protein Source</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={shakeProteinType}
                        onChange={(e) => setShakeProteinType(e.target.value)}
                        className="p-2 bg-white dark:bg-zinc-800 border rounded-lg text-xs"
                      >
                        <option value="whey_protein">Whey Protein Isolate</option>
                        <option value="pea_protein">Pea Protein Powder</option>
                      </select>
                      <div className="flex items-center space-x-1.5 border rounded-lg p-1.5 bg-white dark:bg-zinc-800">
                        <input
                          type="number"
                          value={shakeProteinGrams}
                          onChange={(e) => setShakeProteinGrams(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-transparent border-none text-right font-bold text-xs"
                        />
                        <span className="text-xs text-zinc-400">g</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Add-ins & Superfoods */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-3.5 border">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">3. Add-ins & Superfoods</span>
                    
                    {/* Banana */}
                    <div className="flex justify-between items-center text-xs">
                      <span>🍌 Fresh Banana Count</span>
                      <div className="flex items-center space-x-1.5">
                        <button type="button" onClick={() => setShakeBananaCount(Math.max(0, shakeBananaCount - 1))} className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold">-</button>
                        <span className="font-bold w-4 text-center">{shakeBananaCount}</span>
                        <button type="button" onClick={() => setShakeBananaCount(shakeBananaCount + 1)} className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold">+</button>
                      </div>
                    </div>

                    {/* Peanut Butter */}
                    <div className="flex justify-between items-center text-xs">
                      <span>🥜 Peanut Butter (g)</span>
                      <input
                        type="number"
                        value={shakePbGrams}
                        onChange={(e) => setShakePbGrams(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 p-1.5 bg-white dark:bg-zinc-800 border rounded text-right font-bold"
                      />
                    </div>

                    {/* Seeds checklist */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t">
                      {[
                        { label: "Chia (g)", val: shakeChiaGrams, set: setShakeChiaGrams },
                        { label: "Flax (g)", val: shakeFlaxGrams, set: setShakeFlaxGrams },
                        { label: "Pumpkin (g)", val: shakePumpkinGrams, set: setShakePumpkinGrams }
                      ].map((seed) => (
                        <div key={seed.label} className="p-1.5 bg-white dark:bg-zinc-800 border rounded-lg">
                          <span className="text-[9px] font-bold uppercase text-zinc-400 block">{seed.label}</span>
                          <input
                            type="number"
                            value={seed.val}
                            onChange={(e) => seed.set(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-transparent border-none text-center font-mono font-bold text-xs mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Right col: Shake totals summary & save */}
                <div className="border-l border-zinc-100 dark:border-zinc-800 pl-0 md:pl-6 flex flex-col justify-between font-sans">
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-500 text-white rounded-2xl text-center shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-100">Favorite Protein Shake</span>
                      <div className="font-mono text-3xl font-extrabold mt-1">{Math.round(shakeTotals.calories)} kcal</div>
                      <p className="text-[11px] text-orange-100 mt-1">High protein muscle hyper-recovery builder.</p>
                    </div>

                    {/* Major Macros Card layout */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Total Protein</span>
                        <div className="font-mono text-lg font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{shakeTotals.protein.toFixed(1)}g</div>
                      </div>
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Total Carbs</span>
                        <div className="font-mono text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{shakeTotals.carbs.toFixed(1)}g</div>
                      </div>
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-600 uppercase">Total Fat</span>
                        <div className="font-mono text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{shakeTotals.fat.toFixed(1)}g</div>
                      </div>
                      <div className="p-3 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                        <span className="text-[10px] font-bold text-orange-600 uppercase">Total Fiber</span>
                        <div className="font-mono text-lg font-extrabold text-orange-700 dark:text-orange-300 mt-0.5">{shakeTotals.fiber.toFixed(1)}g</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAndLogShake}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 mt-4 active:scale-98 cursor-pointer"
                    id="btn-save-log-shake"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Shake & Log to {mealTime}</span>
                  </button>
                </div>
              </div>
            )}

            {/* MANUAL ENTRY TAB */}
            {activeTab === "manual" && (
              <div className="lg:col-span-12 flex flex-col justify-between max-w-lg mx-auto w-full space-y-5 h-full">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Food / Meal Item Name</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Grandma's Secret Dal Makhani"
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-medium text-zinc-900 dark:text-white"
                      id="manual-food-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Calories (kcal)</label>
                      <input
                        type="number"
                        value={manualCalories}
                        onChange={(e) => setManualCalories(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono text-center font-bold text-lg"
                        id="manual-calories"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Protein (g)</label>
                      <input
                        type="number"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono text-center font-bold text-lg text-rose-500"
                        id="manual-protein"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono text-center font-bold text-lg text-blue-500"
                        id="manual-carbs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fats (g)</label>
                      <input
                        type="number"
                        value={manualFat}
                        onChange={(e) => setManualFat(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono text-center font-bold text-lg text-amber-500"
                        id="manual-fat"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dietary Fiber (g) - Optional</label>
                    <input
                      type="number"
                      value={manualFiber}
                      onChange={(e) => setManualFiber(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono text-center font-semibold text-orange-500"
                      id="manual-fiber"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualFood}
                  disabled={!manualName.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                  id="btn-log-manual"
                >
                  Log Custom Food Entry
                </button>
              </div>
            )}

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
