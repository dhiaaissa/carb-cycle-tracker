import { useState, useEffect, useMemo } from 'react';
import { Check } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { DEFAULT_DAY_TARGETS } from '../lib/calories';
import TodaySummary from './TodaySummary';
import MealComposer from './MealComposer';
import { MEAL_KEYS, MEAL_ICON_COMPONENTS, MEAL_NUM, computeMealTotals, buildFoodDb } from '../lib/mealTotals';

const EMPTY_MEALS = { meal1: [], meal2: [], meal3: [], meal4: [] };
export default function MacroDayEditor({
  dayIndex, todayIndex, config, foods, presets,
  onSavePreset, onDeletePreset, onCreateCustomFood, onDeleteCustomFood,
  onSaved,
}) {
  const { t } = useTranslation();
  const isFuture = dayIndex > todayIndex;

  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [water, setWater] = useState(0);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutDone, setWorkoutDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState('meal1');

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    api.getDay(dayIndex).then(log => {
      if (cancelled) return;
      if (log) {
        const mj = log.meals_json || {};
        setMeals({ meal1: mj.meal1 || [], meal2: mj.meal2 || [], meal3: mj.meal3 || [], meal4: mj.meal4 || [] });
        setWater(log.water_liters || 0);
        setWeight(log.weight_kg || '');
        setNotes(log.notes || '');
        setWorkoutDone(!!log.workout_done);
      } else {
        setMeals(EMPTY_MEALS); setWater(0); setWeight(''); setNotes(''); setWorkoutDone(false);
      }
      setLoaded(true);
    }).catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [dayIndex]);

  const foodDb = useMemo(() => buildFoodDb(foods?.foods), [foods]);

  // Resolved server-side (shared/dayTargets.js): stored plan → derived → default.
  const target = config?.day_targets?.flat ?? DEFAULT_DAY_TARGETS.flat;

  async function handleSave() {
    setSaving(true);
    setToast('');
    try {
      await api.updateDay(dayIndex, {
        meals,
        water_liters: water,
        weight_kg: weight ? parseFloat(weight) : null,
        notes,
        workout_done: workoutDone,
      });
      setToast(t('macroEditor.saved'));
      setTimeout(() => setToast(''), 2000);
      if (onSaved) onSaved();
    } catch (err) {
      setToast(err.message || t('macroEditor.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function updateMeal(key, items) {
    setMeals(prev => ({ ...prev, [key]: items }));
  }

  if (isFuture) {
    return (
      <div className="text-center py-12">
        
        <h2 className="text-xl font-bold text-ink-800 mb-1">{t('macroEditor.future.title', { num: dayIndex + 1 })}</h2>
        <p className="text-ink-500 text-sm">{t('macroEditor.future.text')}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-door-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-ink-600 font-semibold">{t('macroEditor.loading')}</div>
        </div>
      </div>
    );
  }

  const isToday = dayIndex === todayIndex;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('macroEditor.greeting.morning');
    if (h < 18) return t('macroEditor.greeting.afternoon');
    return t('macroEditor.greeting.evening');
  })();

  return (
    <div className="pb-24">
      {/* Heading */}
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-ink-800 mb-1">{isToday ? t('macroEditor.titleToday', { greeting }) : t('macroEditor.titleDay', { num: dayIndex + 1 })}</h1>
        <p className="text-ink-500">{isToday ? t('macroEditor.subtitleToday', { num: dayIndex + 1 }) : t('macroEditor.subtitleReview')}</p>
      </div>

      <TodaySummary
        meals={meals}
        target={target}
        foodDb={foodDb}
        showMeals={false}
        title={isToday ? undefined : t('macroEditor.titleDay', { num: dayIndex + 1 })}
      />

      {/* Meals */}
      <div className="bg-white rounded-3xl border border-ink-100 p-4 sm:p-6 mb-5">
        <h2 className="text-lg font-bold text-ink-800 mb-3 flex items-center gap-2">{t('macroEditor.meals')}</h2>
        <div className="space-y-2">
          {MEAL_KEYS.map(key => {
            const items = meals[key] || [];
            const totals = computeMealTotals(items, foodDb);
            const isOpen = expandedMeal === key;
            return (
              <div key={key} className={`border rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-door-300' : 'border-ink-100'}`}>
                <button onClick={() => setExpandedMeal(isOpen ? null : key)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-ink-50 transition">
                  <div className="text-start flex items-center gap-3">
                    {(() => { const Icon = MEAL_ICON_COMPONENTS[key]; return <Icon size={22} className="text-ink-500" aria-hidden="true" />; })()}
                    <div>
                      <div className="font-bold text-ink-800">{t(`meal.${MEAL_NUM[key]}`)}</div>
                      <div className="text-xs text-ink-500">{t('macroEditor.itemSummary', {
                        count: items.length,
                        kcal: Math.round(totals.kcal),
                        p: Math.round(totals.protein),
                        c: Math.round(totals.carbs),
                        f: Math.round(totals.fat),
                      })}</div>
                    </div>
                  </div>
                  <div className="text-ink-400 text-2xl">{isOpen ? '−' : '+'}</div>
                </button>
                {isOpen && (
                  <div className="border-t border-ink-100 p-4 bg-ink-50">
                    <MealComposer
                      mealNum={MEAL_NUM[key]}
                      items={items}
                      onChange={(newItems) => updateMeal(key, newItems)}
                      allFoods={foods?.foods}
                      presets={presets}
                      onSavePreset={onSavePreset}
                      onDeletePreset={onDeletePreset}
                      onCreateCustomFood={onCreateCustomFood}
                      onDeleteCustomFood={onDeleteCustomFood}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout */}
      <div className="bg-white rounded-3xl border border-ink-100 p-5 mb-5">
        <button
          onClick={() => setWorkoutDone(v => !v)}
          className={`w-full text-start px-4 py-3 rounded-xl font-bold transition flex items-center justify-between ${workoutDone ? 'bg-olive-50 text-olive-700 border border-olive-200' : 'bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-100'}`}
        >
          <span className="flex items-center gap-2">{t('macroEditor.workoutDone')}</span>
          {workoutDone ? <Check size={20} weight="bold" aria-hidden="true" /> : <span className="w-5 h-5 rounded border border-ink-300" aria-hidden="true" />}
        </button>
      </div>

      {/* Water + weight + notes */}
      <div className="bg-white rounded-3xl border border-ink-100 p-6 mb-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-ink-700 mb-1">{t('macroEditor.waterL')}</label>
            <input type="number" step="0.25" value={water} onChange={e => setWater(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-door-400" />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-700 mb-1">{t('macroEditor.weightKg')}</label>
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-door-400" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-bold text-ink-700 mb-1">{t('macroEditor.notes')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-door-400 resize-none" />
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 lg:start-72 bg-white border-t-2 border-ink-100 px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {toast && <div className={`text-sm font-semibold ${toast === t('macroEditor.saved') ? 'text-olive-600' : 'text-clay-600'}`}>{toast}</div>}
          <button onClick={handleSave} disabled={saving}
            className="ms-auto px-6 py-3 rounded-xl bg-door-500 text-white font-bold disabled:opacity-50">
            {saving ? t('macroEditor.saving') : t('macroEditor.saveDay')}
          </button>
        </div>
      </div>
    </div>
  );
}
