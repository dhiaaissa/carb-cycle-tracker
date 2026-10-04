/**
 * Day calculation: consumed (from meal items) vs. the resolved target for the day type.
 * Targets come from shared/dayTargets.js via server/lib/targets.js.
 */
import { calculateFromMeals } from './foods.js';
import { DEFAULT_DAY_TARGETS, WATER_GOALS } from '../../shared/dayTargets.js';

export { WATER_GOALS };

/**
 * @param {string} dayType — 'low' | 'med' | 'high'
 * @param {{ meal1, meal2, meal3, meal4 }} mealsObj
 * @param {boolean} _workoutDone — kept for API compatibility; workouts add no bonus calories
 * @param {object} [dayTargets] — resolved targets ({ low, med, high }); defaults to the legacy plan
 */
export function calculateDay(dayType, mealsObj, _workoutDone, dayTargets = DEFAULT_DAY_TARGETS) {
  const nutrition = calculateFromMeals(mealsObj);
  const target = dayTargets[dayType]?.calories ?? DEFAULT_DAY_TARGETS.low.calories;

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
