/**
 * Single source of truth for calorie targets, scoring, and water goals.
 * Actual consumed calories/macros are now computed from meal items via foods.js.
 */
import { calculateFromMeals } from './foods.js';

// ── Calorie targets per day type ─────────────────────────────────────
// These are daily guidance targets, not fixed meals.
export const CALORIE_TARGETS = {
  low:  1300,
  med:  1600,
  high: 1550,
};

// ── Macro targets per day type ────────────────────────────────────────
// Approximate targets that sum to each day's calorie goal.
export const MACRO_TARGETS = {
  low:  { protein_g: 120, carbs_g: 95,  fat_g: 48 },
  med:  { protein_g: 130, carbs_g: 150, fat_g: 55 },
  high: { protein_g: 120, carbs_g: 155, fat_g: 52 },
};

// ── Water goals per day type (liters) ─────────────────────────────────
export const WATER_GOALS = {
  low:  2.5,
  med:  3.0,
  high: 3.5,
};

export const WORKOUT_BONUS = 200;

/**
 * Calculates a full day summary from flexible meal compositions.
 *
 * @param {string} dayType — 'low' | 'med' | 'high'
 * @param {{ meal1, meal2, meal3, meal4 }} mealsObj
 * @param {boolean} workoutDone — only applies to med days
 * @returns {{ calories_consumed, calories_target, calories_remaining, protein_g, carbs_g, fat_g, meal1_done … meal4_done }}
 */
export function calculateDay(dayType, mealsObj, workoutDone) {
  const nutrition = calculateFromMeals(mealsObj);

  let target = CALORIE_TARGETS[dayType] ?? 1400;
  // No bonus calories for workout days

  return {
    ...nutrition,
    calories_target:    Math.round(target),
    calories_remaining: Math.round(target - nutrition.calories_consumed),
  };
}

/**
 * Computes the day score (0–5).
 * +1 per meal that has at least one item logged, +1 if water goal reached.
 */
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

export { CALORIE_TARGETS as DAY_TOTALS };
