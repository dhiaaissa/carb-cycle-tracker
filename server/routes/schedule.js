import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateSchedule } from '../lib/schedule.js';

const router = Router();

// GET /api/schedule — returns array of 56 day objects
router.get('/', (req, res) => {
  const config = db.select().from(appConfig).where(eq(appConfig.id, 1)).get();
  if (!config) return res.status(500).json({ error: 'No config found.' });

  res.json(generateSchedule(config.start_date));
});

export default router;
