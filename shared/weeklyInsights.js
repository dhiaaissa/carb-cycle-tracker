/**
 * Weekly insights — a few plain-language findings about the last 7 days.
 * Pure: takes logs + targets, returns findings as { code, tone, params } so the
 * client can translate them. Tone is 'good' | 'neutral' | 'nudge' — never 'bad':
 * the point is a useful next step, not a grade.
 */
import { addDays, diffDays } from './dates.js';

const isWeekend = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return d === 5 || d === 6 || d === 0; // Fri–Sun: the Maghreb weekend plus Sunday's eating pattern
};
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const pct = (a, b) => (b ? (a - b) / b : 0);
const r0 = (v) => Math.round(v);

/**
 * @param {object} p
 * @param {{ date, calories_consumed, calories_target, protein_g, day_type, water_liters, weight_kg }[]} p.logs
 * @param {string} p.today        YYYY-MM-DD (client's local date); the window is the 7 days before it
 * @param {{ [dayType]: { protein_g } }} [p.targets]   resolved day targets (for protein)
 * @param {{ [dayType]: number }} [p.waterGoals]
 * @param {number} [p.max=4]       how many findings to return
 * @returns {{ from, to, daysLogged, findings: { code, tone, params }[] }}
 */
export function weeklyInsights({ logs = [], today, targets = {}, waterGoals = {}, max = 4 }) {
  const to = addDays(today, -1);
  const from = addDays(today, -7);
  const week = (logs || []).filter((l) => l?.date && diffDays(from, l.date) >= 0 && diffDays(l.date, to) >= 0);
  const eaten = week.filter((l) => l.calories_consumed > 0);
  const findings = [];

  // 1. Logging consistency — the habit everything else depends on.
  const n = eaten.length;
  if (n === 0) {
    return { from, to, daysLogged: 0, findings: [{ code: 'no_logs', tone: 'nudge', params: {} }] };
  }
  findings.push(n >= 6
    ? { code: 'logged_well', tone: 'good', params: { days: n }, score: 3.5 }
    : { code: 'logged_some', tone: 'nudge', params: { days: n, missing: 7 - n }, score: n <= 3 ? 9 : 5 });

  // 2. Average intake vs. average target.
  const withTarget = eaten.filter((l) => l.calories_target > 0);
  if (withTarget.length >= 3) {
    const intake = avg(withTarget.map((l) => l.calories_consumed));
    const target = avg(withTarget.map((l) => l.calories_target));
    const d = pct(intake, target);
    if (Math.abs(d) <= 0.07) findings.push({ code: 'on_target', tone: 'good', params: { intake: r0(intake), target: r0(target) }, score: 6 });
    else if (d > 0) findings.push({ code: 'above_target', tone: 'nudge', params: { intake: r0(intake), target: r0(target), diff: r0(intake - target) }, score: 7 + d * 10 });
    else findings.push({ code: 'below_target', tone: 'nudge', params: { intake: r0(intake), target: r0(target), diff: r0(target - intake) }, score: d < -0.2 ? 9 : 6 });
  }

  // 3. Weekend vs weekday calories.
  const we = eaten.filter((l) => isWeekend(l.date)).map((l) => l.calories_consumed);
  const wd = eaten.filter((l) => !isWeekend(l.date)).map((l) => l.calories_consumed);
  if (we.length >= 1 && wd.length >= 2) {
    const diff = avg(we) - avg(wd);
    if (diff > 0 && pct(avg(we), avg(wd)) >= 0.15) {
      findings.push({ code: 'weekend_higher', tone: 'nudge', params: { diff: r0(diff) }, score: 6.5 });
    }
  }

  // 4. Protein: overall, and weekend vs weekday.
  const pTarget = (l) => targets?.[l.day_type]?.protein_g;
  const withP = eaten.filter((l) => pTarget(l) > 0);
  if (withP.length >= 3) {
    const hit = avg(withP.map((l) => l.protein_g / pTarget(l)));
    const weP = withP.filter((l) => isWeekend(l.date)).map((l) => l.protein_g);
    const wdP = withP.filter((l) => !isWeekend(l.date)).map((l) => l.protein_g);
    if (weP.length >= 1 && wdP.length >= 2 && pct(avg(weP), avg(wdP)) <= -0.15) {
      findings.push({ code: 'protein_low_weekend', tone: 'nudge', params: { weekend: r0(avg(weP)), weekday: r0(avg(wdP)) }, score: 7 });
    } else if (hit < 0.85) {
      findings.push({ code: 'protein_low', tone: 'nudge', params: { pct: r0(hit * 100) }, score: 7.5 });
    } else {
      findings.push({ code: 'protein_good', tone: 'good', params: { pct: r0(Math.min(hit, 1.5) * 100) }, score: 3 });
    }
  }

  // 5. Water.
  const waterDays = week.filter((l) => waterGoals[l.day_type] > 0);
  if (waterDays.length >= 3) {
    const met = waterDays.filter((l) => l.water_liters >= waterGoals[l.day_type]).length;
    findings.push(met >= waterDays.length - 1
      ? { code: 'water_good', tone: 'good', params: { days: met }, score: 2 }
      : { code: 'water_low', tone: 'nudge', params: { days: met, of: waterDays.length }, score: 4 });
  }

  // 6. Weight direction (first vs last weigh-in of the week; the chart has the smoothed view).
  const weighed = week.filter((l) => l.weight_kg > 0).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (weighed.length >= 2) {
    const change = +(weighed[weighed.length - 1].weight_kg - weighed[0].weight_kg).toFixed(1);
    findings.push({ code: change < 0 ? 'weight_down' : change > 0 ? 'weight_up' : 'weight_flat', tone: 'neutral', params: { change: Math.abs(change) }, score: 4.5 });
  }

  // Most useful first, but always keep at least one positive note when there is one.
  const sorted = [...findings].sort((a, b) => b.score - a.score);
  let picked = sorted.slice(0, max);
  const good = sorted.find((f) => f.tone === 'good');
  if (good && !picked.includes(good)) picked = [...picked.slice(0, max - 1), good];
  return { from, to, daysLogged: n, findings: picked.map(({ score, ...f }) => f) };
}
