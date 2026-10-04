import { Router } from 'express';
import { getDayByDate, listDays, upsertDay } from '../lib/dayLogs.js';
import { getOrCreateConfig } from '../lib/userConfig.js';
import { addDays, isIsoDate } from '../../shared/dates.js';

const router = Router();

const badDate = (res) => res.status(400).json({ error: 'date must be YYYY-MM-DD' });

// ── Date-keyed API (canonical) ─────────────────────────────────────────

/** GET /days?from=YYYY-MM-DD&to=YYYY-MM-DD — both optional */
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) return badDate(res);
    res.json(await listDays(req.user.id, { from, to }));
  } catch (err) { next(err); }
});

router.get('/date/:date', async (req, res, next) => {
  try {
    if (!isIsoDate(req.params.date)) return badDate(res);
    res.json(await getDayByDate(req.user.id, req.params.date));
  } catch (err) { next(err); }
});

router.put('/date/:date', async (req, res, next) => {
  try {
    if (!isIsoDate(req.params.date)) return badDate(res);
    res.json(await upsertDay(req.user.id, req.params.date, req.body));
  } catch (err) { next(err); }
});

// ── Index-keyed API (legacy, used by the carb-cycle week views) ────────
// day_index = days since start_date; translated to a date and delegated.

async function indexToDate(req, res) {
  const idx = parseInt(req.params.dayIndex, 10);
  if (isNaN(idx) || idx < 0 || idx > 3650) {
    res.status(400).json({ error: 'day_index must be 0–3650' });
    return null;
  }
  const cfg = await getOrCreateConfig(req.user.id);
  return addDays(cfg.start_date, idx);
}

router.get('/:dayIndex', async (req, res, next) => {
  try {
    const date = await indexToDate(req, res);
    if (date) res.json(await getDayByDate(req.user.id, date));
  } catch (err) { next(err); }
});

router.put('/:dayIndex', async (req, res, next) => {
  try {
    const date = await indexToDate(req, res);
    if (date) res.json(await upsertDay(req.user.id, date, req.body));
  } catch (err) { next(err); }
});

export default router;
