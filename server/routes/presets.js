import { Router } from 'express';
import { db } from '../db/index.js';
import { mealPresets } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/presets — list all saved meal presets
router.get('/', (req, res) => {
  const rows = db.select().from(mealPresets).all();
  res.json(rows.map(r => ({ ...r, items_json: JSON.parse(r.items_json) })));
});

// POST /api/presets — save a new preset
router.post('/', (req, res) => {
  const { name, items } = req.body;
  if (!name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'name and items[] required' });
  }
  const now = new Date().toISOString();
  const result = db.insert(mealPresets).values({
    name,
    items_json: JSON.stringify(items),
    created_at: now,
  }).run();

  res.json({ id: result.lastInsertRowid, name, items_json: items, created_at: now });
});

// DELETE /api/presets/:id — delete a preset
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.delete(mealPresets).where(eq(mealPresets.id, id)).run();
  res.json({ ok: true });
});

export default router;
