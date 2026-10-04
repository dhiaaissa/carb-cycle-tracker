import { describe, it, expect } from 'vitest';
import {
  lbToKg, kgToLb, ftInToCm, cmToFtIn,
  validateProfile, bmrMifflin, bmrKatchMcArdle, calcBMR, calcTDEE,
  calcCalorieTarget, calcMacros, proteinReferenceKg, calcPlan, calcCarbCycleTargets,
  trendWeights, estimateAdaptiveTDEE, MIN_CALORIES, KCAL_PER_KG,
} from './nutrition.js';

const male = { sex: 'male', age: 30, weightKg: 80, heightCm: 180, activity: 'moderate' };
const female = { sex: 'female', age: 28, weightKg: 60, heightCm: 165, activity: 'light' };

const macroKcal = (m) => m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9;

/** Build N consecutive days from a start date. */
function days(n, fn, start = '2026-01-01') {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => ({
    date: new Date(t0 + i * 86_400_000).toISOString().slice(0, 10),
    ...fn(i),
  }));
}

describe('unit conversion', () => {
  it('round-trips kg ↔ lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
    expect(lbToKg(kgToLb(73.4))).toBeCloseTo(73.4, 6);
  });

  it('converts ft/in ↔ cm', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(ftInToCm(6)).toBeCloseTo(182.88, 2);
    expect(cmToFtIn(177.8)).toEqual({ ft: 5, in: 10 });
  });

  it('rolls 11.96in over to the next foot instead of showing 5\'12"', () => {
    expect(cmToFtIn(182.8)).toEqual({ ft: 6, in: 0 });
  });

  it('returns null for missing input', () => {
    expect(lbToKg(undefined)).toBeNull();
    expect(kgToLb(NaN)).toBeNull();
    expect(ftInToCm(null)).toBeNull();
    expect(cmToFtIn('180')).toBeNull();
  });
});

describe('validateProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateProfile(male)).toEqual([]);
  });

  it('flags every missing field', () => {
    expect(validateProfile({})).toEqual(['sex', 'age', 'weight', 'height', 'activity']);
    expect(validateProfile()).toHaveLength(5);
  });

  it('rejects extreme values', () => {
    expect(validateProfile({ ...male, weightKg: 400 })).toContain('weight');
    expect(validateProfile({ ...male, heightCm: 60 })).toContain('height');
    expect(validateProfile({ ...male, age: 8 })).toContain('age');
    expect(validateProfile({ ...male, bodyFatPct: 80 })).toContain('bodyFat');
  });

  it('treats body fat as optional', () => {
    expect(validateProfile({ ...male, bodyFatPct: null })).toEqual([]);
    expect(validateProfile({ ...male, bodyFatPct: 15 })).toEqual([]);
  });
});

describe('BMR', () => {
  it('Mifflin-St Jeor matches published values', () => {
    // 10·80 + 6.25·180 − 5·30 + 5 = 1780
    expect(bmrMifflin(male)).toBe(1780);
    // 10·60 + 6.25·165 − 5·28 − 161 = 1330.25
    expect(bmrMifflin(female)).toBeCloseTo(1330.25, 2);
  });

  it('Katch-McArdle uses lean mass', () => {
    // LBM = 80 × 0.85 = 68 → 370 + 21.6·68 = 1838.8
    expect(bmrKatchMcArdle({ weightKg: 80, bodyFatPct: 15 })).toBeCloseTo(1838.8, 1);
  });

  it('prefers Katch-McArdle when body fat is known', () => {
    expect(calcBMR({ ...male, bodyFatPct: 15 }).method).toBe('katch');
    expect(calcBMR(male).method).toBe('mifflin');
  });

  it('returns null when data is missing', () => {
    expect(bmrMifflin({ sex: 'male', weightKg: 80 })).toBeNull();
    expect(bmrMifflin({ ...male, sex: 'other' })).toBeNull();
    expect(bmrKatchMcArdle({ weightKg: 80, bodyFatPct: 0 })).toBeNull();
    expect(calcBMR({})).toBeNull();
  });
});

describe('TDEE', () => {
  it('applies the activity multiplier', () => {
    expect(calcTDEE(1780, 'sedentary')).toBeCloseTo(2136, 0);
    expect(calcTDEE(1780, 'extreme')).toBeCloseTo(3382, 0);
  });

  it('returns null for unknown activity rather than silently guessing', () => {
    expect(calcTDEE(1780, 'couch')).toBeNull();
    expect(calcTDEE(null, 'moderate')).toBeNull();
  });
});

describe('calcCalorieTarget', () => {
  const base = { tdee: 2759, sex: 'male', weightKg: 80 };

  it('maintain = TDEE', () => {
    const r = calcCalorieTarget({ ...base, goal: 'maintain', rateKgPerWeek: 0.5 });
    expect(r.calories).toBe(2759);
    expect(r.warnings).toEqual([]);
  });

  it('0.5 kg/week loss ≈ 550 kcal/day deficit', () => {
    const r = calcCalorieTarget({ ...base, goal: 'lose', rateKgPerWeek: 0.5 });
    expect(r.dailyDelta).toBe(-550);
    expect(r.calories).toBe(2209);
    expect(r.effectiveRate).toBe(0.5);
  });

  it('gain adds a surplus', () => {
    const r = calcCalorieTarget({ ...base, goal: 'gain', rateKgPerWeek: 0.25 });
    expect(r.dailyDelta).toBe(275);
  });

  it('accepts a negative rate — direction comes from the goal', () => {
    const r = calcCalorieTarget({ ...base, goal: 'lose', rateKgPerWeek: -0.5 });
    expect(r.dailyDelta).toBe(-550);
  });

  it('caps loss at 1% of body weight per week', () => {
    const r = calcCalorieTarget({ tdee: 2200, sex: 'female', weightKg: 55, goal: 'lose', rateKgPerWeek: 1.0 });
    expect(r.warnings.map((w) => w.code)).toContain('rate_capped_bodyweight');
    expect(r.effectiveRate).toBeLessThanOrEqual(0.55);
  });

  it('caps the deficit at 25% of TDEE', () => {
    const r = calcCalorieTarget({ tdee: 2000, sex: 'male', weightKg: 150, goal: 'lose', rateKgPerWeek: 1.0 });
    expect(r.warnings.map((w) => w.code)).toContain('deficit_capped');
    expect(r.calories).toBe(1500);
  });

  it('never goes below the sex-specific minimum', () => {
    const r = calcCalorieTarget({ tdee: 1500, sex: 'female', weightKg: 50, goal: 'lose', rateKgPerWeek: 0.5 });
    expect(r.calories).toBe(MIN_CALORIES.female);
    expect(r.warnings.map((w) => w.code)).toContain('below_minimum');
  });

  it('does not push a very small person above maintenance to reach the floor', () => {
    const r = calcCalorieTarget({ tdee: 1100, sex: 'female', weightKg: 40, goal: 'lose', rateKgPerWeek: 0.25 });
    expect(r.calories).toBe(1100);
    expect(r.dailyDelta).toBe(0);
  });

  it('caps gain at 0.5 kg/week', () => {
    const r = calcCalorieTarget({ ...base, goal: 'gain', rateKgPerWeek: 2 });
    expect(r.effectiveRate).toBe(0.5);
    expect(r.warnings[0].code).toBe('gain_rate_capped');
  });

  it('returns null for bad input', () => {
    expect(calcCalorieTarget({ tdee: null, goal: 'lose' })).toBeNull();
    expect(calcCalorieTarget({ tdee: 2000, goal: 'bulk' })).toBeNull();
  });
});

describe('macros', () => {
  it('macro calories add up to the target (±10 kcal rounding)', () => {
    for (const preset of ['balanced', 'high_protein', 'low_carb']) {
      const m = calcMacros({ calories: 2200, weightKg: 80, heightCm: 180, preset });
      expect(Math.abs(macroKcal(m) - 2200)).toBeLessThanOrEqual(10);
    }
  });

  it('protein scales with body weight, not calories', () => {
    const m = calcMacros({ calories: 2200, weightKg: 80, heightCm: 180, preset: 'balanced' });
    expect(m.protein_g).toBe(128); // 1.6 × 80
  });

  it('fat meets its minimum share', () => {
    const m = calcMacros({ calories: 2000, weightKg: 70, heightCm: 175, preset: 'balanced' });
    expect(m.fat_g * 9).toBeGreaterThanOrEqual(2000 * 0.30 - 9);
  });

  it('low_carb caps carbs at 20%', () => {
    const m = calcMacros({ calories: 2000, weightKg: 70, heightCm: 175, preset: 'low_carb' });
    expect(m.carbs_g * 4).toBeLessThanOrEqual(2000 * 0.20 + 4);
  });

  it('uses a capped reference weight at high BMI', () => {
    // 140 kg at 175 cm (BMI 45.7) → ref = 27.5 × 1.75² ≈ 84.2 kg
    expect(proteinReferenceKg({ weightKg: 140, heightCm: 175 })).toBeCloseTo(84.2, 1);
    expect(proteinReferenceKg({ weightKg: 70, heightCm: 175 })).toBe(70);
  });

  it('uses lean mass when body fat is known', () => {
    // 100 kg at 30% → lean 70 → 70/0.8 = 87.5
    expect(proteinReferenceKg({ weightKg: 100, bodyFatPct: 30 })).toBeCloseTo(87.5, 1);
  });

  it('never produces negative carbs on tiny targets', () => {
    const m = calcMacros({ calories: 800, weightKg: 120, heightCm: 200, preset: 'high_protein' });
    expect(m.carbs_g).toBeGreaterThanOrEqual(0);
    expect(m.warnings.map((w) => w.code)).toContain('protein_reduced');
    expect(Math.abs(macroKcal(m) - 800)).toBeLessThanOrEqual(10);
  });

  it('falls back to balanced for an unknown preset', () => {
    const a = calcMacros({ calories: 2000, weightKg: 70, preset: 'keto9000' });
    const b = calcMacros({ calories: 2000, weightKg: 70, preset: 'balanced' });
    expect(a).toEqual(b);
  });

  it('returns null without calories or weight', () => {
    expect(calcMacros({ calories: 0, weightKg: 70 })).toBeNull();
    expect(calcMacros({ calories: 2000 })).toBeNull();
  });
});

describe('calcPlan', () => {
  it('produces a full plan', () => {
    const p = calcPlan(male, { goal: 'lose', rateKgPerWeek: 0.5, preset: 'high_protein' });
    expect(p.ok).toBe(true);
    expect(p.bmr).toBe(1780);
    expect(p.tdee).toBe(2759);
    expect(p.calories).toBe(2209);
    expect(p.protein_g).toBe(176);
  });

  it('reports validation errors instead of throwing', () => {
    expect(calcPlan({ sex: 'male' })).toEqual({ ok: false, errors: ['age', 'weight', 'height', 'activity'] });
  });
});

describe('calcCarbCycleTargets', () => {
  it('orders days low < high < med and keeps protein constant', () => {
    const t = calcCarbCycleTargets({ tdee: 2400, sex: 'male', weightKg: 80, heightCm: 180 });
    expect(t.low.calories).toBeLessThan(t.high.calories);
    expect(t.high.calories).toBeLessThan(t.med.calories);
    expect(t.low.protein_g).toBe(t.med.protein_g);
    expect(t.low.carbs_g).toBeLessThan(t.med.carbs_g);
  });

  it('makes low days genuinely low-carb (≤20% kcal), with fat taking the slack', () => {
    const t = calcCarbCycleTargets({ tdee: 2759, sex: 'male', weightKg: 80, heightCm: 180 });
    expect(t.low.carbs_g * 4).toBeLessThanOrEqual(t.low.calories * 0.20 + 4);
    expect(t.low.carbs_g).toBeLessThan(t.med.carbs_g / 2);
    expect(Math.abs(macroKcal(t.low) - t.low.calories)).toBeLessThanOrEqual(10);
  });

  it('accepts a preset object for one-off variations', () => {
    const m = calcMacros({ calories: 2000, weightKg: 70, preset: { proteinPerKg: 2, fatMinPct: 0.3 } });
    expect(m.protein_g).toBe(140);
  });

  it('respects the floor on low days', () => {
    const t = calcCarbCycleTargets({ tdee: 1600, sex: 'female', weightKg: 55, heightCm: 160 });
    expect(t.low.calories).toBe(1200);
  });

  it('returns null without TDEE', () => {
    expect(calcCarbCycleTargets({ sex: 'male', weightKg: 80 })).toBeNull();
  });
});

describe('trendWeights', () => {
  it('smooths daily noise', () => {
    const e = days(14, (i) => ({ weightKg: 80 + (i % 2 ? 1 : -1) }));
    const t = trendWeights(e);
    const last = t.at(-1);
    expect(Math.abs(last.trendKg - 80)).toBeLessThan(0.3);
  });

  it('windows by calendar date, not entry count', () => {
    const t = trendWeights([
      { date: '2026-01-01', weightKg: 90 },
      { date: '2026-01-20', weightKg: 80 },
    ]);
    expect(t[1].trendKg).toBe(80); // the 90 is 19 days old, outside the window
  });

  it('ignores missing weights and unsorted input', () => {
    const t = trendWeights([
      { date: '2026-01-03', weightKg: 81 },
      { date: '2026-01-02', weightKg: null },
      { date: '2026-01-01', weightKg: 79 },
    ]);
    expect(t.map((x) => x.date)).toEqual(['2026-01-01', '2026-01-03']);
    expect(t[1].trendKg).toBe(80);
  });

  it('handles empty input', () => {
    expect(trendWeights([])).toEqual([]);
    expect(trendWeights(undefined)).toEqual([]);
  });
});

describe('estimateAdaptiveTDEE', () => {
  it('recovers true TDEE from a steady loss', () => {
    // Eating 2000/day and losing 0.5 kg/week ⇒ TDEE = 2000 + 550 = 2550
    const e = days(28, (i) => ({ intakeKcal: 2000, weightKg: 90 - (0.5 / 7) * i }));
    const r = estimateAdaptiveTDEE(e, { formulaTdee: 2300 });
    expect(r.status).toBe('ok');
    expect(r.tdee).toBeGreaterThan(2500);
    expect(r.tdee).toBeLessThan(2600);
    expect(r.trendChangeKgPerWeek).toBeCloseTo(-0.5, 1);
    expect(r.confidence).toBe('high');
    expect(r.suggest).toBe(true);
  });

  it('is robust to water-weight noise', () => {
    // ±1 kg alternating swings on top of a flat trend at maintenance
    const e = days(28, (i) => ({ intakeKcal: 2400, weightKg: 80 + (i % 3 === 0 ? 1 : -0.5) }));
    const r = estimateAdaptiveTDEE(e);
    expect(Math.abs(r.tdee - 2400)).toBeLessThan(200);
  });

  it('excludes unlogged days instead of treating them as 0 kcal', () => {
    const e = days(28, (i) => ({ intakeKcal: i % 4 === 0 ? null : 2200, weightKg: 75 }));
    const r = estimateAdaptiveTDEE(e);
    expect(r.avgIntake).toBe(2200);
    expect(r.tdee).toBe(2200);
    expect(r.confidence).toBe('medium');
  });

  it('only uses the lookback window', () => {
    const old = days(30, () => ({ intakeKcal: 4000, weightKg: 100 }), '2025-11-01');
    const recent = days(28, () => ({ intakeKcal: 2000, weightKg: 70 }), '2026-01-01');
    expect(estimateAdaptiveTDEE([...old, ...recent]).avgIntake).toBe(2000);
  });

  it('asks for more data when the span is too short', () => {
    const r = estimateAdaptiveTDEE(days(10, () => ({ intakeKcal: 2000, weightKg: 80 })));
    expect(r).toEqual({ status: 'insufficient', reason: 'spanDays', have: 10, need: 14 });
  });

  it('asks for more weigh-ins', () => {
    const e = days(21, (i) => ({ intakeKcal: 2000, weightKg: i % 7 === 0 ? 80 : null }));
    expect(estimateAdaptiveTDEE(e)).toMatchObject({ status: 'insufficient', reason: 'weighIns' });
  });

  it('asks for more intake logs', () => {
    const e = days(21, (i) => ({ intakeKcal: i < 5 ? 2000 : null, weightKg: 80 }));
    expect(estimateAdaptiveTDEE(e)).toMatchObject({ status: 'insufficient', reason: 'intakeDays' });
  });

  it('handles empty / garbage input', () => {
    expect(estimateAdaptiveTDEE([]).status).toBe('insufficient');
    expect(estimateAdaptiveTDEE(null).status).toBe('insufficient');
    expect(estimateAdaptiveTDEE([{ date: 'nope' }]).status).toBe('insufficient');
  });

  it('does not suggest a change for small differences', () => {
    const e = days(28, () => ({ intakeKcal: 2400, weightKg: 80 }));
    expect(estimateAdaptiveTDEE(e, { formulaTdee: 2350 }).suggest).toBe(false);
  });

  it('uses the standard 7700 kcal/kg constant', () => {
    expect(KCAL_PER_KG).toBe(7700);
  });
});
