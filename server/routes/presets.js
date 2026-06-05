import { Router } from 'express';
import { db } from '../db/index.js';
import { mealPresets } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.select().from(mealPresets).all();
    res.json(rows.map(r => ({ ...r, items_json: JSON.parse(r.items_json) })));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, items } = req.body;
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'name and items[] required' });
    }
    const now = new Date().toISOString();
    const result = await db.insert(mealPresets).values({
      name,
      items_json: JSON.stringify(items),
      created_at: now,
    }).run();

    res.json({ id: Number(result.lastInsertRowid), name, items_json: items, created_at: now });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(mealPresets).where(eq(mealPresets.id, id)).run();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
