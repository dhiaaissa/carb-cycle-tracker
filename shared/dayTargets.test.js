import { describe, it, expect } from 'vitest';
import { resolveDayTargets, planForProgramme, goalSettingsFor, toProfile, DEFAULT_DAY_TARGETS } from './dayTargets.js';

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

describe('goalSettingsFor', () => {
  it('uses programme defaults when nothing is stored', () => {
    expect(goalSettingsFor('muscle_gain')).toEqual({ goal: 'gain', rateKgPerWeek: 0.25, preset: 'balanced' });
  });

  it('prefers stored settings, field by field', () => {
    expect(goalSettingsFor('weight_loss', { goal_rate_kg_week: 0.75 }))
      .toEqual({ goal: 'lose', rateKgPerWeek: 0.75, preset: 'high_protein' });
    expect(goalSettingsFor('weight_loss', { macro_preset: 'low_carb' }).preset).toBe('low_carb');
  });

  it('picks a sensible rate when the goal changes but no rate is stored', () => {
    expect(goalSettingsFor('weight_loss', { goal: 'gain' }).rateKgPerWeek).toBe(0.25);
    expect(goalSettingsFor('muscle_gain', { goal: 'maintain', goal_rate_kg_week: 0.5 }).rateKgPerWeek).toBe(0);
  });

  it('ignores invalid stored values', () => {
    expect(goalSettingsFor('recomp', { goal: 'bulk', macro_preset: 'keto9000', goal_rate_kg_week: -1 }))
      .toEqual({ goal: 'lose', rateKgPerWeek: 0.25, preset: 'high_protein' });
  });
});

describe('flat target', () => {
  it('derives a flat target from the profile and goal', () => {
    const t = resolveDayTargets({ programme: 'weight_loss', profile });
    expect(t.flat.calories).toBe(planForProgramme('weight_loss', profile).calories);
  });

  it('uses the stored setup target for macro programmes', () => {
    const t = resolveDayTargets({ programme: 'weight_loss', profile, stored: { calories: 2100, protein_g: 170 } });
    expect(t.flat.calories).toBe(2100);
    expect(t.flat.protein_g).toBe(170);
    expect(t.flat.fat_g).toBeGreaterThan(0); // unfilled stored fields fall back to derived
  });

  it('ignores stored single targets for carb cycle', () => {
    const t = resolveDayTargets({ programme: 'carb_cycle', profile, stored: { calories: 999 } });
    expect(t.flat.calories).not.toBe(999);
  });

  it('respects goal settings', () => {
    const lose = resolveDayTargets({ programme: 'weight_loss', profile, goalSettings: { goal: 'lose', rateKgPerWeek: 0.5, preset: 'balanced' } });
    const keep = resolveDayTargets({ programme: 'weight_loss', profile, goalSettings: { goal: 'maintain', rateKgPerWeek: 0, preset: 'balanced' } });
    expect(keep.flat.calories - lose.flat.calories).toBe(550); // 0.75 would hit the 25% deficit cap
  });

  it('has a default without a profile', () => {
    expect(resolveDayTargets({ programme: 'recomp' }).flat).toEqual(DEFAULT_DAY_TARGETS.flat);
  });
});
