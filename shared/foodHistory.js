/**
 * Recent and frequent foods from a user's own logs — the fastest way to log
 * is re-logging what you usually eat, in the amount you usually eat it.
 */
import { MEAL_KEYS, isQuick } from './mealItems.js';

/**
 * @param {{ date: string, meals_json: object }[]} logs  any order
 * @param {{ limit?: number }} [opts]
 * @returns {{ recent: {food_id, amount, last_date}[], frequent: {food_id, amount, count}[] }}
 *   `amount` is the most recently used amount (what people actually want re-added).
 */
export function rankFoods(logs, { limit = 12 } = {}) {
  const byFood = new Map();
  const sorted = [...(logs || [])].filter((l) => l?.date && l.meals_json).sort((a, b) => (a.date < b.date ? -1 : 1));

  for (const log of sorted) {
    for (const key of MEAL_KEYS) {
      for (const item of log.meals_json[key] || []) {
        if (!item?.food_id || isQuick(item) || !(item.amount > 0)) continue;
        const s = byFood.get(item.food_id) ?? { food_id: item.food_id, count: 0, amount: item.amount, last_date: log.date };
        s.count += 1;
        s.amount = item.amount;      // later logs overwrite → last used amount
        s.last_date = log.date;
        byFood.set(item.food_id, s);
      }
    }
  }

  const all = [...byFood.values()];
  const recent = [...all].sort((a, b) => (a.last_date === b.last_date ? b.count - a.count : a.last_date < b.last_date ? 1 : -1))
    .slice(0, limit).map(({ food_id, amount, last_date }) => ({ food_id, amount, last_date }));
  const frequent = all.filter((f) => f.count >= 2)
    .sort((a, b) => b.count - a.count || (a.last_date < b.last_date ? 1 : -1))
    .slice(0, limit).map(({ food_id, amount, count }) => ({ food_id, amount, count }));
  return { recent, frequent };
}
