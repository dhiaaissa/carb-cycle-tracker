import { describe, it, expect } from 'vitest';
import { weeklyInsights } from './weeklyInsights.js';
import { addDays } from './dates.js';

const TODAY = '2026-10-05'; // Monday → window is Mon 28 Sep … Sun 4 Oct
const targets = { low: { protein_g: 130 }, med: { protein_g: 130 } };
const waterGoals = { low: 2.5, med: 3 };

function week(fn) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(TODAY, -7 + i);
    return { date, day_type: 'low', calories_target: 2000, calories_consumed: 2000, protein_g: 130, water_liters: 3, weight_kg: null, ...fn(i, date) };
  });
}
const codes = (r) => r.findings.map((f) => f.code);
const isWeekend = (iso) => [0, 5, 6].includes(new Date(`${iso}T12:00:00Z`).getUTCDay());

describe('weeklyInsights', () => {
  it('uses the 7 days before today', () => {
    const r = weeklyInsights({ logs: week(() => ({})), today: TODAY, targets, waterGoals });
    expect(r.from).toBe('2026-09-28');
    expect(r.to).toBe('2026-10-04');
    expect(r.daysLogged).toBe(7);
  });

  it('a steady week gets positive findings only', () => {
    const r = weeklyInsights({ logs: week(() => ({})), today: TODAY, targets, waterGoals });
    expect(r.findings.every((f) => f.tone !== 'nudge')).toBe(true);
    expect(codes(r)).toEqual(expect.arrayContaining(['logged_well', 'on_target']));
  });

  it('no logs → one gentle nudge', () => {
    expect(weeklyInsights({ logs: [], today: TODAY }).findings).toEqual([{ code: 'no_logs', tone: 'nudge', params: {} }]);
  });

  it('ignores logs outside the window and empty days', () => {
    const logs = [...week(() => ({ calories_consumed: 0 })), { date: addDays(TODAY, -20), calories_consumed: 9999, calories_target: 2000 }];
    expect(weeklyInsights({ logs, today: TODAY }).daysLogged).toBe(0);
  });

  it('spots higher weekends', () => {
    const r = weeklyInsights({ logs: week((i, d) => ({ calories_consumed: isWeekend(d) ? 2700 : 1900 })), today: TODAY, targets, waterGoals });
    const f = r.findings.find((x) => x.code === 'weekend_higher');
    expect(f.params.diff).toBe(800);
  });

  it('spots protein dropping at the weekend', () => {
    const r = weeklyInsights({ logs: week((i, d) => ({ protein_g: isWeekend(d) ? 80 : 140 })), today: TODAY, targets, waterGoals });
    expect(r.findings.find((x) => x.code === 'protein_low_weekend').params).toEqual({ weekend: 80, weekday: 140 });
  });

  it('flags generally low protein with a percentage', () => {
    const r = weeklyInsights({ logs: week(() => ({ protein_g: 90 })), today: TODAY, targets, waterGoals });
    expect(r.findings.find((x) => x.code === 'protein_low').params.pct).toBe(69);
  });

  it('above / below target carry the average difference', () => {
    expect(weeklyInsights({ logs: week(() => ({ calories_consumed: 2400 })), today: TODAY }).findings.find((f) => f.code === 'above_target').params.diff).toBe(400);
    expect(weeklyInsights({ logs: week(() => ({ calories_consumed: 1500 })), today: TODAY }).findings.find((f) => f.code === 'below_target').params.diff).toBe(500);
  });

  it('a patchy week leads with logging, but keeps a positive note', () => {
    const logs = week((i) => (i < 3 ? {} : { calories_consumed: 0, water_liters: 0 }));
    const r = weeklyInsights({ logs, today: TODAY, targets, waterGoals, max: 3 });
    expect(r.findings[0]).toMatchObject({ code: 'logged_some', params: { days: 3, missing: 4 } });
    expect(r.findings.some((f) => f.tone === 'good')).toBe(true);
  });

  it('reports weight direction from the week’s weigh-ins', () => {
    const logs = week((i) => ({ weight_kg: i === 0 ? 82.4 : i === 6 ? 81.8 : null }));
    expect(weeklyInsights({ logs, today: TODAY }).findings.find((f) => f.code === 'weight_down').params.change).toBe(0.6);
  });

  it('never returns a "bad" tone and respects max', () => {
    const logs = week((i, d) => ({ calories_consumed: isWeekend(d) ? 3000 : 1200, protein_g: 40, water_liters: 0.5, weight_kg: 80 + i * 0.2 }));
    const r = weeklyInsights({ logs, today: TODAY, targets, waterGoals, max: 3 });
    expect(r.findings).toHaveLength(3);
    expect(r.findings.every((f) => ['good', 'neutral', 'nudge'].includes(f.tone))).toBe(true);
  });
});
