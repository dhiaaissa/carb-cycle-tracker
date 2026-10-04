import { describe, it, expect } from 'vitest';
import { resolveDayTargets, planForProgramme, toProfile, DEFAULT_DAY_TARGETS } from './dayTargets.js';

const profile = toProfile({ sex: 'male', age: 30, height_cm: 180, current_weight_kg: 80, activity_level: 'moderate' });

describe('toProfile', () => {
  it('maps snake_case DB fields and prefers weight_kg over current_weight_kg', () => {
    expect(profile).toMatchObject({ sex: 'male', heightCm: 180, weightKg: 80, activity: 'moderate' });
    expect(toProfile({ weight_kg: 70, current_weight_kg: 90 }).weightKg).toBe(70);
  });
});

describe('resolveDayTargets', () => {
  it('falls back to the legacy plan without a profile', () => {
    const t = resolveDayTargets();
    expect(t.source).toBe('default');
    expect(t.low).toEqual(DEFAULT_DAY_TARGETS.low);
  });

  it('derives from TDEE when the profile is complete', () => {
    const t = resolveDayTargets({ profile });
    expect(t.source).toBe('derived');
    expect(t.med.calories).toBe(Math.round(2759 * 0.88));
  });

  it('uses stored TDEE when present', () => {
    expect(resolveDayTargets({ profile, tdee: 2000 }).low.calories).toBe(1500); // 1440 → male floor
  });

  it('applies manual overrides field by field', () => {
    const t = resolveDayTargets({ profile, overrides: { low: { calories: 1700 }, high: { protein_g: 200 } } });
    expect(t.low.calories).toBe(1700);
    expect(t.low.protein_g).toBe(resolveDayTargets({ profile }).low.protein_g);
    expect(t.high.protein_g).toBe(200);
  });

  it('ignores empty / invalid overrides', () => {
    const t = resolveDayTargets({ overrides: { low: { calories: null, fat_g: 0 }, med: 'junk' } });
    expect(t.low).toEqual(DEFAULT_DAY_TARGETS.low);
    expect(t.med).toEqual(DEFAULT_DAY_TARGETS.med);
  });

  it('falls back to defaults when the profile is incomplete', () => {
    expect(resolveDayTargets({ profile: { sex: 'male' } }).source).toBe('default');
  });
});

describe('planForProgramme', () => {
  it('adds per-day targets for carb cycle only', () => {
    expect(planForProgramme('carb_cycle', profile).dayTargets.low.calories).toBeGreaterThan(0);
    expect(planForProgramme('weight_loss', profile).dayTargets).toBeUndefined();
  });

  it('muscle gain is a surplus, recomp a small deficit', () => {
    const gain = planForProgramme('muscle_gain', profile);
    const recomp = planForProgramme('recomp', profile);
    expect(gain.calories).toBeGreaterThan(gain.tdee);
    expect(recomp.tdee - recomp.calories).toBe(275);
  });
});
