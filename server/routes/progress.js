/**
 * Progress data: intake + weight series, smoothed trend weight, and the
 * adaptive TDEE estimate. Works for every programme (date-keyed).
 */
import { Router } from 'express';
import { listDays } from '../lib/dayLogs.js';
import { loadUserContext } from '../lib/targets.js';
import { trendWeights, estimateAdaptiveTDEE } from '../../shared/nutrition.js';
import { addDays, isIsoDate } from '../../shared/dates.js';

const router = Router();

/**
 * GET /progress?days=90&today=YYYY-MM-DD
 * `today` should be the client's local date (server runs in UTC).
 */
router.get('/', async (req, res, next) => {
  try {
    const today = isIsoDate(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const from = addDays(today, -(days - 1));

    const [{ cfg }, logs] = await Promise.all([
      loadUserContext(req.user.id),
      listDays(req.user.id, { from, to: today }),
    ]);

    // A day counts as "logged" only if something was eaten — an empty row
    // (e.g. only water ticked) must not read as a 0 kcal day.
    const series = logs.map((l) => ({
      date: l.date,
      intakeKcal: l.calories_consumed > 0 ? Math.round(l.calories_consumed) : null,
      weightKg: l.weight_kg ?? null,
    }));

    res.json({
      from,
      to: today,
      series,
      trend: trendWeights(series),
      adaptive: estimateAdaptiveTDEE(series, { formulaTdee: cfg?.tdee ?? undefined }),
    });
  } catch (err) { next(err); }
});

export default router;
