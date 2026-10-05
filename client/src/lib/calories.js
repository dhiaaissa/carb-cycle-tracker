/**
 * Client-side calorie helpers — mirrors server/lib/calories.js.
 * Server is always the source of truth; this is for optimistic UI only.
 * Targets come from config.day_targets (resolved server-side by shared/dayTargets.js).
 */
import { FOODS } from './foods.js';
import { totalsFromMeals } from '../../../shared/mealItems.js';
import { DEFAULT_DAY_TARGETS, WATER_GOALS } from '../../../shared/dayTargets.js';

export { DEFAULT_DAY_TARGETS, WATER_GOALS };

/** Full day calc from flexible mealsObj */
export function calculateDay(dayType, mealsObj = {}, _workoutDone = false, dayTargets = DEFAULT_DAY_TARGETS, foodDb = FOODS) {
  const nutrition = totalsFromMeals(mealsObj, foodDb);
  const target = dayTargets[dayType]?.calories ?? DEFAULT_DAY_TARGETS.low.calories;
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
