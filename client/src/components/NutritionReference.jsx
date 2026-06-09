import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  { key: 'low',  labelKey: 'nutritionRef.lowCarbDay',  headerCls: 'bg-gradient-to-r from-red-500 to-red-600' },
  { key: 'med',  labelKey: 'nutritionRef.medCarbDay',  headerCls: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  { key: 'high', labelKey: 'nutritionRef.highCarbDay', headerCls: 'bg-gradient-to-r from-green-500 to-green-600' },
];

export default function NutritionReference() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 mb-8 shadow-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-start font-bold text-gray-700 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <span className="text-lg font-bold">{t('nutritionRef.title')}</span>
            <p className="text-xs text-gray-400 font-normal">{t('nutritionRef.subtitle')}</p>
          </div>
        </div>
        <span className="text-gray-400 text-xl" style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {open && (
        <div className="border-t-2 border-gray-100">
          {/* Food database table */}
          <div className="p-5 pb-3">
            <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">{t('nutritionRef.ingredientRef')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {FOOD_CATEGORIES.map(cat =>
                Object.values(FOODS).filter(f => f.category === cat.key).map(food => {
                  const per = food.unit === 'g'
                    ? t('nutritionRef.kcalPer100g', { kcal: food.kcal_per_100g })
                    : t('nutritionRef.kcalPerUnit', { kcal: food.kcal_per_unit, unit: food.unit });
                  return (
                    <div key={food.id} className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 flex items-center gap-2">
                      <span className="text-xl shrink-0">{food.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-800 truncate">{food.name}</div>
                        <div className="text-xs text-gray-500">{per}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Suggested meal templates */}
          <div className="px-5 pb-5">
            <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">{t('nutritionRef.suggestedTemplates')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TYPES.map(ty => {
                const suggested = SUGGESTED[ty.key];
                const dayTotal = Object.values(suggested).reduce((sum, items) => {
                  return sum + sumMealNutrition(items).kcal;
                }, 0);

                return (
                  <div key={ty.key} className="rounded-xl overflow-hidden border border-gray-200">
                    <div className={`${ty.headerCls} text-white px-4 py-3`}>
                      <div className="font-bold">{t(ty.labelKey)}</div>
                      <div className="text-xs text-white/80 mt-0.5">
                        {t('nutritionRef.dayTotalKcal', { kcal: Math.round(dayTotal), liters: WATER_GOALS[ty.key] })}
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {['meal1', 'meal2', 'meal3', 'meal4'].map((mk, i) => {
                        const items = suggested[mk];
                        const mealKcal = Math.round(sumMealNutrition(items).kcal);
                        return (
                          <div key={mk} className="text-xs">
                            <div className="flex justify-between font-bold text-gray-700 mb-0.5">
                              <span>{t('weekPage.mealNum', { num: i + 1 })}</span>
                              <span>{t('nutritionRef.mealKcal', { kcal: mealKcal })}</span>
                            </div>
                            <div className="text-gray-500 leading-relaxed">
                              {items.map((item, j) => {
                                const f = FOODS[item.food_id];
                                return (
                                  <span key={j}>
                                    {f?.emoji} {item.amount}{f?.unit === 'g' ? 'g' : f?.unit === 'piece' ? 'x' : ''} {f?.name.split(' ')[0]}
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
        </div>
      )}
    </div>
  );
}
