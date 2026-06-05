import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateSchedule } from '../lib/schedule.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const config = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    if (!config) return res.status(500).json({ error: 'No config for user.' });
    res.json(generateSchedule(config.start_date));
  } catch (err) { next(err); }
});

export default router;
