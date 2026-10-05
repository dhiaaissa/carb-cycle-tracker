import { Router } from 'express';
import { db } from '../db/index.js';
import { customFoods, dayLogs, appConfig } from '../db/schema.js';
import { rankFoods } from '../../shared/foodHistory.js';
import { getOrCreateConfig } from '../lib/userConfig.js';
import { loadFoodDb } from '../lib/foodDb.js';
import { eq, and, gte } from 'drizzle-orm';
import { FOODS, FOOD_CATEGORIES } from '../lib/foods.js';

const router = Router();

const readSettings = (cfg) => { try { return JSON.parse(cfg?.settings_json || '{}'); } catch { return {}; } };

/** Recent + frequent foods (last 60 days) and favourites — powers one-tap logging. */
router.get('/history', async (req, res, next) => {
  try {
    const from = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
    const rows = await db.select({ date: dayLogs.date, meals_json: dayLogs.meals_json }).from(dayLogs)
      .where(and(eq(dayLogs.user_id, req.user.id), gte(dayLogs.date, from))).all();
    const logs = rows.map((r) => { try { return { date: r.date, meals_json: JSON.parse(r.meals_json || '{}') }; } catch { return null; } }).filter(Boolean);
    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    res.json({ ...rankFoods(logs), favorites: readSettings(cfg).favorite_foods || [] });
  } catch (err) { next(err); }
});

/** PUT /foods/favorites { food_id, favorite } — merged server-side so other settings are untouched. */
router.put('/favorites', async (req, res, next) => {
  try {
    const { food_id, favorite } = req.body || {};
    if (typeof food_id !== 'string' || !food_id || food_id.length > 80) return res.status(400).json({ error: 'food_id required' });
    const cfg = await getOrCreateConfig(req.user.id);
    const settings = readSettings(cfg);
    const set = new Set(settings.favorite_foods || []);
    if (favorite) set.add(food_id); else set.delete(food_id);
    settings.favorite_foods = [...set].slice(0, 100);
    await db.update(appConfig).set({ settings_json: JSON.stringify(settings) }).where(eq(appConfig.user_id, req.user.id)).run();
    res.json({ favorites: settings.favorite_foods });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const allFoods = await loadFoodDb(req.user.id);
    const customs = Object.values(allFoods).filter((f) => f.custom);

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
