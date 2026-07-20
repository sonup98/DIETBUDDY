/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trash2, Edit3, Plus, Coffee, Sun, Sunrise, Moon, 
  Sparkles, Check, X, GlassWater, ChevronDown, ChevronUp 
} from "lucide-react";
import { LogEntry, MealTime } from "../types";
import { COMMON_FOOD_DATABASE } from "../data/foods";

interface TimelineProps {
  logEntries: LogEntry[];
  waterDrankMl: number;
  onAddWater: (amountMl: number) => void;
  onRemoveLog: (id: string) => void;
  onUpdateLogPortion: (id: string, newWeight: number) => void;
  onOpenAddFood: (meal: MealTime) => void;
}

export default function Timeline({
  logEntries,
  waterDrankMl,
  onAddWater,
  onRemoveLog,
  onUpdateLogPortion,
  onOpenAddFood
}: TimelineProps) {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editWeightGrams, setEditWeightGrams] = useState<number>(100);

  const mealSlots: { id: MealTime; label: string; icon: any; colorClass: string; desc: string }[] = [
    { id: "Breakfast", label: "Breakfast", icon: Sunrise, colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/20", desc: "First energy load" },
    { id: "Lunch", label: "Lunch", icon: Sun, colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-950/20", desc: "Midday core fuel" },
    { id: "Snacks", label: "Snacks & Pre-Workout", icon: Coffee, colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-950/20", desc: "Steady endurance" },
    { id: "Dinner", label: "Dinner", icon: Moon, colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950/20", desc: "Nocturnal cell repair" }
  ];

  const handleStartEdit = (entry: LogEntry) => {
    setEditingEntryId(entry.id);
    setEditWeightGrams(entry.weightGrams);
  };

  const handleSaveEdit = (entry: LogEntry) => {
    onUpdateLogPortion(entry.id, editWeightGrams);
    setEditingEntryId(null);
  };

  const getMealSlotTotals = (slotId: MealTime) => {
    return logEntries
      .filter((e) => e.timeOfDay === slotId)
      .reduce((acc, curr) => {
        acc.calories += curr.calories;
        acc.protein += curr.protein;
        acc.carbs += curr.carbs;
        acc.fat += curr.fat;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  return (
    <div id="timeline-tab" className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header section */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border">
        <div>
          <h2 className="text-lg font-sans font-extrabold text-zinc-900 dark:text-white">Daily Timeline</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Chronological record of your food, macros, and hydration.</p>
        </div>
        
        {/* Dynamic Water quick logger */}
        <div className="flex items-center space-x-2.5 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 px-3.5 py-1.5 rounded-xl">
          <GlassWater className="w-5 h-5 text-cyan-500 animate-bounce" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block">Hydration</span>
            <span className="font-mono text-xs font-bold text-cyan-800 dark:text-cyan-300 block">{waterDrankMl} ml</span>
          </div>
          <div className="flex space-x-1 pl-1">
            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="px-2 py-0.5 bg-cyan-500 text-white font-bold text-[9px] rounded-md hover:bg-cyan-600 transition-all cursor-pointer"
            >
              +250
            </button>
            <button
              type="button"
              onClick={() => onAddWater(500)}
              className="px-2 py-0.5 bg-cyan-600 text-white font-bold text-[9px] rounded-md hover:bg-cyan-700 transition-all cursor-pointer"
            >
              +500
            </button>
          </div>
        </div>
      </div>

      {/* Slots Stack */}
      <div className="space-y-4">
        {mealSlots.map((slot) => {
          const slotEntries = logEntries.filter((e) => e.timeOfDay === slot.id);
          const totals = getMealSlotTotals(slot.id);
          const SlotIcon = slot.icon;

          return (
            <div
              key={slot.id}
              className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 shadow-3xs overflow-hidden"
              id={`meal-slot-${slot.id}`}
            >
              {/* Slot Header */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${slot.colorClass}`}>
                    <SlotIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{slot.label}</h3>
                    <span className="text-[10px] text-zinc-400 leading-none">{slot.desc}</span>
                  </div>
                </div>

                {/* Slot Macro totals or Quick Add */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                  {slotEntries.length > 0 ? (
                    <div className="flex items-center space-x-4">
                      {/* Calories */}
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Calories</span>
                        <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{Math.round(totals.calories)} kcal</span>
                      </div>
                      {/* Macro Breakdown */}
                      <div className="hidden sm:flex space-x-2 text-right">
                        <div>
                          <span className="text-[8px] font-bold text-rose-500 uppercase block">P</span>
                          <span className="font-mono text-[10px] font-bold block text-rose-700 dark:text-rose-300">{totals.protein.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-blue-500 uppercase block">C</span>
                          <span className="font-mono text-[10px] font-bold block text-blue-700 dark:text-blue-300">{totals.carbs.toFixed(1)}g</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-amber-500 uppercase block">F</span>
                          <span className="font-mono text-[10px] font-bold block text-amber-700 dark:text-amber-300">{totals.fat.toFixed(1)}g</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onOpenAddFood(slot.id)}
                    className="p-1.5 rounded-lg hover:bg-orange-50/50 dark:hover:bg-zinc-800 text-orange-500 hover:text-orange-600 font-bold text-xs flex items-center space-x-1 border border-dashed border-orange-300 dark:border-orange-850"
                    id={`btn-add-food-${slot.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Food</span>
                  </button>
                </div>
              </div>

              {/* Slot Entries List */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <AnimatePresence initial={false}>
                  {slotEntries.map((entry) => {
                    const isEditing = editingEntryId === entry.id;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 flex flex-col justify-between hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                      >
                        {isEditing ? (
                          /* PORTION ADJUSTER BOX */
                          <div className="space-y-3 p-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Adjust Portion: <strong>{entry.name}</strong></span>
                              <span className="font-mono font-bold text-orange-500 text-sm">{editWeightGrams} g</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <input
                                type="range"
                                min="10"
                                max="1000"
                                step="5"
                                value={editWeightGrams}
                                onChange={(e) => setEditWeightGrams(parseInt(e.target.value))}
                                className="flex-1 accent-orange-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(entry)}
                                  className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-xs"
                                  title="Save portion weight"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEntryId(null)}
                                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-lg transition-all"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* DEFAULT ENTRY CARD */
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{entry.name}</div>
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                {entry.weightGrams}g portion • Pro: {entry.protein.toFixed(1)}g • Carbs: {entry.carbs.toFixed(1)}g • Fat: {entry.fat.toFixed(1)}g • Fiber: {entry.fiber.toFixed(1)}g
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">{Math.round(entry.calories)} kcal</span>
                              
                              {/* Edit portion, Delete actions */}
                              <div className="flex space-x-1 border-l border-zinc-100 dark:border-zinc-850 pl-3">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(entry)}
                                  className="p-1.5 text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                  title="Edit Portion Size"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveLog(entry.id)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                                  title="Delete Log"
                                  id={`btn-delete-log-${entry.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {slotEntries.length === 0 && (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    Nothing logged for {slot.label}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
