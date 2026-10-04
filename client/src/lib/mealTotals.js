/**
 * Nutrition totals for meal items against a food table (built-in + custom foods).
 * Shared by the dashboards so every screen adds up meals the same way.
 */
import { FOODS as BUILTIN_FOODS } from './foods';

export const MEAL_KEYS = ['meal1', 'meal2', 'meal3', 'meal4'];
// Phosphor icon components per meal slot (breakfast, lunch, dinner, snack).
export { MEAL_ICON_COMPONENTS } from './mealIcons.jsx';
export const MEAL_NUM = { meal1: 1, meal2: 2, meal3: 3, meal4: 4 };

const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function itemNutrition(foodDb, foodId, amount) {
  const food = foodDb[foodId];
  if (!food || !amount || amount <= 0) return ZERO;
  if (food.unit === 'g') {
    const r = amount / 100;
    return {
      kcal: (food.kcal_per_100g || 0) * r,
      protein: (food.protein_per_100g || 0) * r,
      carbs: (food.carbs_per_100g || 0) * r,
      fat: (food.fat_per_100g || 0) * r,
    };
  }
  return {
    kcal: (food.kcal_per_unit || 0) * amount,
    protein: (food.protein_per_unit || 0) * amount,
    carbs: (food.carbs_per_unit || 0) * amount,
    fat: (food.fat_per_unit || 0) * amount,
  };
}

export function computeMealTotals(items = [], foodDb = BUILTIN_FOODS) {
  return items.reduce((acc, it) => {
    const n = itemNutrition(foodDb, it.food_id, it.amount);
    return { kcal: acc.kcal + n.kcal, protein: acc.protein + n.protein, carbs: acc.carbs + n.carbs, fat: acc.fat + n.fat };
  }, ZERO);
}

/** Built-in foods merged with the user's custom foods (from /api/foods). */
export function buildFoodDb(apiFoods) {
  return { ...BUILTIN_FOODS, ...(apiFoods || {}) };
}
