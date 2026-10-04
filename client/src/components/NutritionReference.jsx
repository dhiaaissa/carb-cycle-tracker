import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { DayTypeSwatch } from './ui/primitives';
import { FOODS, FOOD_CATEGORIES, sumMealNutrition } from '../lib/foods';
import { WATER_GOALS } from '../lib/calories';

const SUGGESTED = {
  low: {
    meal1: [{ food_id: 'eggs', amount: 3 }, { food_id: 'cucumber', amount: 150 }],
    meal2: [{ food_id: 'chicken_breast', amount: 150 }, { food_id: 'bulgur_cooked', amount: 100 }, { food_id: 'cucumber', amount: 200 }],
    meal3: [{ food_id: 'tuna_canned', amount: 150 }, { food_id: 'potatoes_boiled', amount: 150 }, { food_id: 'cucumber', amount: 200 }],
    meal4: [{ food_id: 'yaarout', amount: 1 }, { food_id: 'almonds', amount: 25 }],
  },
  med: {
    meal1: [{ food_id: 'eggs', amount: 3 }, { food_id: 'rice_cooked', amount: 100 }, { food_id: 'cucumber', amount: 150 }],
    meal2: [{ food_id: 'chicken_breast', amount: 150 }, { food_id: 'bulgur_cooked', amount: 150 }, { food_id: 'cucumber', amount: 200 }],
    meal3: [{ food_id: 'tuna_canned', amount: 150 }, { food_id: 'potatoes_boiled', amount: 200 }, { food_id: 'cucumber', amount: 200 }],
    meal4: [{ food_id: 'yaarout', amount: 1 }, { food_id: 'almonds', amount: 25 }, { food_id: 'strawberries', amount: 100 }],
  },
  high: {
    meal1: [{ food_id: 'eggs', amount: 3 }, { food_id: 'rice_cooked', amount: 150 }, { food_id: 'cucumber', amount: 150 }],
    meal2: [{ food_id: 'chicken_breast', amount: 150 }, { food_id: 'bulgur_cooked', amount: 200 }, { food_id: 'cucumber', amount: 200 }],
    meal3: [{ food_id: 'minced_meat', amount: 150 }, { food_id: 'potatoes_boiled', amount: 200 }, { food_id: 'cucumber', amount: 200 }],
    meal4: [{ food_id: 'yaarout', amount: 1 }, { food_id: 'peaches', amount: 1 }, { food_id: 'strawberries', amount: 100 }],
  },
};

const TYPES = [
  { key: 'low',  labelKey: 'nutritionRef.lowCarbDay' },
  { key: 'med',  labelKey: 'nutritionRef.medCarbDay' },
  { key: 'high', labelKey: 'nutritionRef.highCarbDay' },
];

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function NutritionReference() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = norm(query.trim());

  return (
    <section className="bg-white border border-ink-200 rounded-xl mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full px-5 sm:px-6 py-4 text-start flex items-center justify-between gap-4 hover:bg-ink-50 rounded-xl"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">{t('nutritionRef.title')}</h2>
          <p className="text-sm text-ink-500">{t('nutritionRef.subtitle')}</p>
        </div>
        <CaretDown size={20} className={`text-ink-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="border-t border-ink-200 px-5 sm:px-6 py-5 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-ink-900 mb-3">{t('nutritionRef.suggestedTemplates')}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {TYPES.map((ty) => {
                const suggested = SUGGESTED[ty.key];
                const dayTotal = Object.values(suggested).reduce((sum, items) => sum + sumMealNutrition(items).kcal, 0);
                return (
                  <div key={ty.key}>
                    <div className="flex items-center gap-2 pb-2 border-b border-ink-200">
                      <DayTypeSwatch type={ty.key} className="w-3 h-3" />
                      <span className="font-semibold text-sm text-ink-900">{t(ty.labelKey)}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1.5 mb-3 tabular-nums">{t('nutritionRef.dayTotalKcal', { kcal: Math.round(dayTotal), liters: WATER_GOALS[ty.key] })}</p>
                    <div className="space-y-3">
                      {['meal1', 'meal2', 'meal3', 'meal4'].map((mk, i) => {
                        const items = suggested[mk];
                        return (
                          <div key={mk} className="text-xs">
                            <div className="flex justify-between font-semibold text-ink-800 mb-0.5">
                              <span>{t('weekPage.mealNum', { num: i + 1 })}</span>
                              <span className="tabular-nums font-normal text-ink-500">{t('nutritionRef.mealKcal', { kcal: Math.round(sumMealNutrition(items).kcal) })}</span>
                            </div>
                            <div className="text-ink-600 leading-relaxed">
                              {items.map((item, j) => {
                                const f = FOODS[item.food_id];
                                return (
                                  <span key={j}>
                                    {item.amount}{f?.unit === 'g' ? 'g' : f?.unit === 'piece' ? '×' : ''} {f?.name.split(' (')[0] ?? item.food_id}
                                    {j < items.length - 1 ? ' · ' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-ink-900">{t('nutritionRef.ingredientRef')}</h3>
              <label className="relative">
                <span className="sr-only">{t('grocery.search')}</span>
                <MagnifyingGlass size={16} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('grocery.search')}
                  className="h-9 w-56 ps-8 pe-3 rounded-lg border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200" />
              </label>
            </div>
            <div className="max-h-[420px] overflow-y-auto border border-ink-200 rounded-lg" data-scroll>
              <table className="w-full text-sm tabular-nums">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-xs text-ink-500 border-b border-ink-200">
                    <th className="px-3 py-2 text-start font-medium">{t('nutritionRef.food')}</th>
                    <th className="px-3 py-2 text-end font-medium">kcal</th>
                    <th className="px-3 py-2 text-end font-medium">{t('macro.protein_short')}</th>
                    <th className="px-3 py-2 text-end font-medium">{t('macro.carbs_short')}</th>
                    <th className="px-3 py-2 text-end font-medium">{t('macro.fat_short')}</th>
                    <th className="px-3 py-2 text-end font-medium">{t('nutritionRef.per')}</th>
                  </tr>
                </thead>
                {FOOD_CATEGORIES.map((cat) => {
                  const rows = Object.values(FOODS).filter((f) => f.category === cat.key && (!q || norm(f.name).includes(q)));
                  if (!rows.length) return null;
                  return (
                    <tbody key={cat.key} className="divide-y divide-ink-200">
                      <tr><th colSpan={6} className="px-3 pt-3 pb-1 text-start text-xs font-semibold text-ink-600 bg-ink-50">{t(`foodCat.${cat.key}`)}</th></tr>
                      {rows.map((f) => {
                        const g = f.unit === 'g';
                        return (
                          <tr key={f.id}>
                            <td className="px-3 py-1.5 text-ink-900"><span aria-hidden="true" className="me-2">{f.emoji}</span>{f.name}</td>
                            <td className="px-3 py-1.5 text-end text-ink-900 font-medium">{g ? f.kcal_per_100g : f.kcal_per_unit}</td>
                            <td className="px-3 py-1.5 text-end text-ink-600">{g ? f.protein_per_100g : f.protein_per_unit}</td>
                            <td className="px-3 py-1.5 text-end text-ink-600">{g ? f.carbs_per_100g : f.carbs_per_unit}</td>
                            <td className="px-3 py-1.5 text-end text-ink-600">{g ? f.fat_per_100g : f.fat_per_unit}</td>
                            <td className="px-3 py-1.5 text-end text-ink-500 text-xs">{g ? '100 g' : f.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
