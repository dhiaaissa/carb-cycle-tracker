import { describe, it, expect } from 'vitest';
import { itemNutrition, sumItems, totalsFromMeals, makeQuickItem, sanitizeMeals, QUICK_FOOD_ID } from './mealItems.js';
import { rankFoods } from './foodHistory.js';

const DB = {
  rice: { unit: 'g', kcal_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  egg: { unit: 'piece', kcal_per_unit: 78, protein_per_unit: 6, carbs_per_unit: 0.6, fat_per_unit: 5 },
  custom_shake: { unit: 'g', kcal_per_100g: 400, protein_per_100g: 80, carbs_per_100g: 8, fat_per_100g: 5, custom: true },
};

describe('itemNutrition', () => {
  it('scales per-100g and per-unit foods', () => {
    expect(itemNutrition({ food_id: 'rice', amount: 200 }, DB).kcal).toBeCloseTo(260);
    expect(itemNutrition({ food_id: 'egg', amount: 3 }, DB).protein_g).toBe(18);
  });

  it('counts custom foods (they used to be 0 kcal server-side)', () => {
    expect(itemNutrition({ food_id: 'custom_shake', amount: 30 }, DB).kcal).toBeCloseTo(120);
  });

  it('uses the values carried by quick-add items', () => {
    const q = makeQuickItem({ label: 'Restaurant pizza', kcal: '850', protein_g: '32' });
    expect(itemNutrition(q, DB)).toEqual({ kcal: 850, protein_g: 32, carbs_g: 0, fat_g: 0 });
  });

  it('treats unknown foods and bad amounts as zero', () => {
    expect(itemNutrition({ food_id: 'nope', amount: 100 }, DB).kcal).toBe(0);
    expect(itemNutrition({ food_id: 'rice', amount: -5 }, DB).kcal).toBe(0);
    expect(itemNutrition({ food_id: 'rice', amount: 'abc' }, DB).kcal).toBe(0);
    expect(itemNutrition(null, DB).kcal).toBe(0);
  });
});

describe('totals', () => {
  it('adds a day across meals and marks meals done', () => {
    const t = totalsFromMeals({ meal1: [{ food_id: 'egg', amount: 2 }], meal3: [makeQuickItem({ kcal: 300 })] }, DB);
    expect(t.calories_consumed).toBe(456);
    expect([t.meal1_done, t.meal2_done, t.meal3_done, t.meal4_done]).toEqual([true, false, true, false]);
  });

  it('sumItems handles empty input', () => {
    expect(sumItems(undefined, DB).kcal).toBe(0);
  });
});

describe('makeQuickItem / sanitizeMeals', () => {
  it('clamps absurd values and trims the label', () => {
    const q = makeQuickItem({ label: 'x'.repeat(100), kcal: 999999, fat_g: -10 });
    expect(q.kcal).toBe(5000);
    expect(q.fat_g).toBe(0);
    expect(q.label).toHaveLength(40);
  });

  it('drops junk, keeps valid items, normalises quick items', () => {
    const out = sanitizeMeals({
      meal1: [{ food_id: 'rice', amount: 150 }, { food_id: 'rice', amount: 0 }, null, { amount: 5 }],
      meal2: [{ food_id: QUICK_FOOD_ID, kcal: '420', label: ' Sandwich ', extra: 'x' }],
      meal9: [{ food_id: 'rice', amount: 1 }],
      meal3: 'not an array',
    });
    expect(out.meal1).toEqual([{ food_id: 'rice', amount: 150 }]);
    expect(out.meal2[0]).toMatchObject({ food_id: QUICK_FOOD_ID, kcal: 420, label: 'Sandwich' });
    expect(out.meal2[0].extra).toBeUndefined();
    expect(out.meal9).toBeUndefined();
    expect(out.meal3).toEqual([]);
  });

  it('caps items per meal', () => {
    const many = Array.from({ length: 100 }, () => ({ food_id: 'rice', amount: 10 }));
    expect(sanitizeMeals({ meal1: many }).meal1).toHaveLength(60);
  });
});

describe('rankFoods', () => {
  const logs = [
    { date: '2026-10-01', meals_json: { meal1: [{ food_id: 'oats', amount: 250 }], meal2: [{ food_id: 'rice', amount: 150 }] } },
    { date: '2026-10-02', meals_json: { meal1: [{ food_id: 'oats', amount: 300 }], meal2: [{ food_id: 'chicken', amount: 200 }] } },
    { date: '2026-10-03', meals_json: { meal1: [{ food_id: 'oats', amount: 280 }, makeQuickItem({ kcal: 500 })] } },
  ];

  it('recent = last used first, with the last amount', () => {
    const { recent } = rankFoods(logs);
    expect(recent[0]).toEqual({ food_id: 'oats', amount: 280, last_date: '2026-10-03' });
    expect(recent.map((r) => r.food_id)).toEqual(['oats', 'chicken', 'rice']);
  });

  it('frequent = eaten at least twice, most often first', () => {
    expect(rankFoods(logs).frequent).toEqual([{ food_id: 'oats', amount: 280, count: 3 }]);
  });

  it('ignores quick-add items and handles empty input', () => {
    expect(rankFoods(logs).recent.some((r) => r.food_id === QUICK_FOOD_ID)).toBe(false);
    expect(rankFoods([])).toEqual({ recent: [], frequent: [] });
    expect(rankFoods(null)).toEqual({ recent: [], frequent: [] });
  });

  it('respects the limit', () => {
    const lots = [{ date: '2026-10-01', meals_json: { meal1: Array.from({ length: 30 }, (_, i) => ({ food_id: `f${i}`, amount: 10 })) } }];
    expect(rankFoods(lots, { limit: 5 }).recent).toHaveLength(5);
  });
});
