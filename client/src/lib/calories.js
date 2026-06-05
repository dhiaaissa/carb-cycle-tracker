/**
 * Client-side calorie helpers — mirrors server/lib/calories.js.
 * Server is always the source of truth; this is for optimistic UI only.
 */
import { calculateFromMeals } from './foods.js';

export const CALORIE_TARGETS = { low: 1300, med: 1600, high: 1550 };
export const WATER_GOALS     = { low: 2.5,  med: 3.0,  high: 3.5  };
export const WORKOUT_BONUS   = 200;

// Macro targets per day type (protein/carbs/fat in grams)
export const MACRO_TARGETS = {
  low:  { protein_g: 120, carbs_g: 95,  fat_g: 48 },
  med:  { protein_g: 130, carbs_g: 150, fat_g: 55 },
  high: { protein_g: 120, carbs_g: 155, fat_g: 52 },
};

/** Full day calc from flexible mealsObj */
export function calculateDay(dayType, mealsObj = {}, workoutDone = false) {
  const nutrition = calculateFromMeals(mealsObj);
  let target = CALORIE_TARGETS[dayType] ?? 1400;
  // No bonus calories for workout days
  return {
    ...nutrition,
    calories_target:    Math.round(target),
    calories_remaining: Math.round(target - nutrition.calories_consumed),
  };
}

export function calculateScore(dayType, meal1Done, meal2Done, meal3Done, meal4Done, waterLiters) {
  let score = 0;
  if (meal1Done) score++;
  if (meal2Done) score++;
  if (meal3Done) score++;
  if (meal4Done) score++;
  if (waterLiters >= WATER_GOALS[dayType]) score++;
  return score;
}

export function scoreLabel(score) {
  if (score === 5) return 'Perfect';
  if (score >= 3) return 'Good';
  return 'Weak day';
}
