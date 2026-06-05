import { Router } from 'express';
import { db } from '../db/index.js';
import { customFoods } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { FOODS, FOOD_CATEGORIES } from '../lib/foods.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const customs = await db.select().from(customFoods).where(eq(customFoods.user_id, req.user.id)).all();

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

    const cats = [...FOOD_CATEGORIES];
    if (customs.length > 0 && !cats.some(c => c.key === 'custom')) {
      cats.push({ key: 'custom', label: 'My Foods', emoji: '⭐' });
    }

    const grouped = cats.map(cat => ({
      ...cat,
      foods: Object.values(allFoods).filter(f => f.category === cat.key),
    })).filter(cat => cat.foods.length > 0);

    res.json({ foods: allFoods, categories: grouped });
  } catch (err) { next(err); }
});

router.post('/custom', async (req, res, next) => {
  try {
    const { name, emoji, unit, kcal, protein, carbs, fat, default_amount, step } = req.body;
    if (!name || !unit) return res.status(400).json({ error: 'name and unit are required' });

    const food_id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
    const now = new Date().toISOString();

    const existing = await db.select().from(customFoods)
      .where(and(eq(customFoods.user_id, req.user.id), eq(customFoods.food_id, food_id)))
      .get();
    if (existing) return res.status(409).json({ error: 'A custom food with a similar name already exists' });

    const record = {
      user_id: req.user.id,
      food_id,
      name,
      emoji: emoji || '🍽️',
      category: 'custom',
      unit,
      default_amount: default_amount || (unit === 'g' ? 100 : 1),
      step: step || (unit === 'g' ? 25 : 1),
      created_at: now,
    };

    if (unit === 'g') {
      record.kcal_per_100g = kcal || 0;
      record.protein_per_100g = protein || 0;
      record.carbs_per_100g = carbs || 0;
      record.fat_per_100g = fat || 0;
    } else {
      record.kcal_per_unit = kcal || 0;
      record.protein_per_unit = protein || 0;
      record.carbs_per_unit = carbs || 0;
      record.fat_per_unit = fat || 0;
    }

    await db.insert(customFoods).values(record).run();
    res.json({ id: food_id, ...record });
  } catch (err) { next(err); }
});

router.delete('/custom/:foodId', async (req, res, next) => {
  try {
    const { foodId } = req.params;
    await db.delete(customFoods)
      .where(and(eq(customFoods.user_id, req.user.id), eq(customFoods.food_id, foodId)))
      .run();
    res.json({ deleted: foodId });
  } catch (err) { next(err); }
});

export default router;
