/**
 * Meal items — the one place that knows how much nutrition an item carries.
 * Shared by server (stored totals) and client (live totals), so they can't disagree.
 *
 * Item shapes inside meals_json:
 *   { food_id: 'escalope_poulet', amount: 150 }            built-in or custom food
 *   { food_id: '__quick', amount: 1, label, kcal, protein_g, carbs_g, fat_g }   quick add
 */

export const QUICK_FOOD_ID = '__quick';
export const MEAL_KEYS = ['meal1', 'meal2', 'meal3', 'meal4'];

const ZERO = Object.freeze({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 0));

export const isQuick = (item) => item?.food_id === QUICK_FOOD_ID;

/** Nutrition for one item. Unknown foods and bad amounts count as zero. */
export function itemNutrition(item, foodDb = {}) {
  if (!item) return ZERO;
  if (isQuick(item)) {
    return {
      kcal: clamp(num(item.kcal), 0, 5000),
      protein_g: clamp(num(item.protein_g), 0, 500),
      carbs_g: clamp(num(item.carbs_g), 0, 1000),
      fat_g: clamp(num(item.fat_g), 0, 500),
    };
  }
  const food = foodDb[item.food_id];
  const amount = num(item.amount);
  if (!food || !(amount > 0)) return ZERO;
  if (food.unit === 'g') {
    const r = amount / 100;
    return {
      kcal: (food.kcal_per_100g || 0) * r,
      protein_g: (food.protein_per_100g || 0) * r,
      carbs_g: (food.carbs_per_100g || 0) * r,
      fat_g: (food.fat_per_100g || 0) * r,
    };
  }
  return {
    kcal: (food.kcal_per_unit || 0) * amount,
    protein_g: (food.protein_per_unit || 0) * amount,
    carbs_g: (food.carbs_per_unit || 0) * amount,
    fat_g: (food.fat_per_unit || 0) * amount,
  };
}

export function sumItems(items = [], foodDb = {}) {
  return (items || []).reduce((acc, it) => {
    const n = itemNutrition(it, foodDb);
    return { kcal: acc.kcal + n.kcal, protein_g: acc.protein_g + n.protein_g, carbs_g: acc.carbs_g + n.carbs_g, fat_g: acc.fat_g + n.fat_g };
  }, { ...ZERO });
}

/** Whole-day totals in the shape day_logs stores. */
export function totalsFromMeals(mealsObj = {}, foodDb = {}) {
  const t = { ...ZERO };
  const done = {};
  for (const key of MEAL_KEYS) {
    const items = mealsObj?.[key] || [];
    done[key] = items.length > 0;
    const n = sumItems(items, foodDb);
    t.kcal += n.kcal; t.protein_g += n.protein_g; t.carbs_g += n.carbs_g; t.fat_g += n.fat_g;
  }
  return {
    calories_consumed: Math.round(t.kcal),
    protein_g: Math.round(t.protein_g),
    carbs_g: Math.round(t.carbs_g),
    fat_g: Math.round(t.fat_g),
    meal1_done: done.meal1, meal2_done: done.meal2, meal3_done: done.meal3, meal4_done: done.meal4,
  };
}

/** Builds a quick-add item from loose input (form fields are strings). */
export function makeQuickItem({ label = '', kcal, protein_g, carbs_g, fat_g } = {}) {
  return {
    food_id: QUICK_FOOD_ID,
    amount: 1,
    label: String(label || '').trim().slice(0, 40),
    kcal: Math.round(clamp(num(kcal), 0, 5000)),
    protein_g: Math.round(clamp(num(protein_g), 0, 500)),
    carbs_g: Math.round(clamp(num(carbs_g), 0, 1000)),
    fat_g: Math.round(clamp(num(fat_g), 0, 500)),
  };
}

/**
 * Server-side cleaning of a client-sent meals object: known meal keys only,
 * at most 60 items per meal, sane amounts, quick items normalised.
 */
export function sanitizeMeals(mealsObj) {
  const out = {};
  if (!mealsObj || typeof mealsObj !== 'object') return out;
  for (const key of MEAL_KEYS) {
    const items = Array.isArray(mealsObj[key]) ? mealsObj[key].slice(0, 60) : [];
    out[key] = items
      .filter((it) => it && typeof it.food_id === 'string' && it.food_id.length <= 80)
      .map((it) => (isQuick(it) ? makeQuickItem(it) : { food_id: it.food_id, amount: clamp(num(it.amount), 0, 10000) }))
      .filter((it) => isQuick(it) ? it.kcal > 0 : it.amount > 0);
  }
  return out;
}
