/**
 * Nutrition totals for meal items against a food table (built-in + custom foods).
 * Shared by the dashboards so every screen adds up meals the same way.
 */
import { FOODS as BUILTIN_FOODS } from './foods';
import { sumItems } from '../../../shared/mealItems.js';

export const MEAL_KEYS = ['meal1', 'meal2', 'meal3', 'meal4'];
// Phosphor icon components per meal slot (breakfast, lunch, dinner, snack).
export { MEAL_ICON_COMPONENTS } from './mealIcons.jsx';
export const MEAL_NUM = { meal1: 1, meal2: 2, meal3: 3, meal4: 4 };

/** Totals for a list of items as { kcal, protein, carbs, fat } (built-in, custom and quick-add items). */
export function computeMealTotals(items = [], foodDb = BUILTIN_FOODS) {
  const n = sumItems(items, foodDb);
  return { kcal: n.kcal, protein: n.protein_g, carbs: n.carbs_g, fat: n.fat_g };
}

/** Built-in foods merged with the user's custom foods (from /api/foods). */
export function buildFoodDb(apiFoods) {
  return { ...BUILTIN_FOODS, ...(apiFoods || {}) };
}
