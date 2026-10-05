import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { customFoods } from '../db/schema.js';
import { FOODS } from './foods.js';

/** Built-in foods merged with the user's custom foods. Used for display *and* server-side totals. */
export async function loadFoodDb(userId) {
  const customs = await db.select().from(customFoods).where(eq(customFoods.user_id, userId)).all();
  const allFoods = { ...FOODS };
  for (const c of customs) {
    allFoods[c.food_id] = {
      id: c.food_id,
      name: c.name,
      emoji: c.emoji,
      category: c.category,
      unit: c.unit,
      ...(c.unit === 'g' ? {
        kcal_per_100g: c.kcal_per_100g,
        protein_per_100g: c.protein_per_100g,
        carbs_per_100g: c.carbs_per_100g,
        fat_per_100g: c.fat_per_100g,
      } : {
        kcal_per_unit: c.kcal_per_unit,
        protein_per_unit: c.protein_per_unit,
        carbs_per_unit: c.carbs_per_unit,
        fat_per_unit: c.fat_per_unit,
      }),
      default_amount: c.default_amount,
      step: c.step,
      custom: true,
    };
  }
  return allFoods;
}

