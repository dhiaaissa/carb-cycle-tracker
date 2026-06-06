import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import MacroProgressCard from './MacroProgressCard';
import MealComposer from './MealComposer';
import ProgrammeSetup from './ProgrammeSetup';
import { FOODS as BUILTIN_FOODS } from '../lib/foods';

const EMPTY_MEALS = { meal1: [], meal2: [], meal3: [], meal4: [] };
const MEAL_NAMES = { meal1: 'Breakfast', meal2: 'Lunch', meal3: 'Dinner', meal4: 'Snack' };
const MEAL_NUM = { meal1: 1, meal2: 2, meal3: 3, meal4: 4 };

function itemNutrition(foodDb, foodId, amount) {
  const food = foodDb[foodId];
  if (!food || !amount || amount <= 0) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  if (food.unit === 'g') {
    const r = amount / 100;
    return {
      kcal: (food.kcal_per_100g || 0) * r,
      protein: (food.protein_per_100g || 0) * r,
      carbs: (food.carbs_per_100g || 0) * r,
      fat: (food.fat_per_100g || 0) * r,
    };
  }
  return {
    kcal: (food.kcal_per_unit || 0) * amount,
    protein: (food.protein_per_unit || 0) * amount,
    carbs: (food.carbs_per_unit || 0) * amount,
    fat: (food.fat_per_unit || 0) * amount,
  };
}

function computeMealTotals(items = [], foodDb) {
  return items.reduce((acc, it) => {
    const n = itemNutrition(foodDb, it.food_id, it.amount);
    return {
      kcal: acc.kcal + n.kcal,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

export default function MacroDailyView({ config, foods, presets, onSavePreset, onDeletePreset, onCreateCustomFood, onDeleteCustomFood, onLogout, user }) {
  const todayIdx = config?.today_index ?? 0;
  const dayIdx = Math.max(0, todayIdx);

  const [dayLog, setDayLog] = useState(null);
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [water, setWater] = useState(0);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showProgrammeSetup, setShowProgrammeSetup] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const log = await api.getDay(dayIdx);
        if (log) {
          const mj = log.meals_json || {};
          setMeals({ meal1: mj.meal1 || [], meal2: mj.meal2 || [], meal3: mj.meal3 || [], meal4: mj.meal4 || [] });
          setWater(log.water_liters || 0);
          setWeight(log.weight_kg || '');
          setNotes(log.notes || '');
          setDayLog(log);
        }
      } catch (err) {
        console.warn('Could not load day log:', err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [dayIdx]);

  const foodDb = useMemo(() => ({ ...BUILTIN_FOODS, ...(foods?.foods || {}) }), [foods]);

  const totals = useMemo(() => {
    const all = [...meals.meal1, ...meals.meal2, ...meals.meal3, ...meals.meal4];
    return computeMealTotals(all, foodDb);
  }, [meals, foodDb]);

  const calTarget = config?.calorie_target || 2000;
  const protTarget = config?.protein_g_target || 150;
  const carbTarget = config?.carbs_g_target || 200;
  const fatTarget = config?.fat_g_target || 65;

  const caloriesRemaining = Math.max(0, calTarget - totals.kcal);
  const caloriePct = Math.min(100, (totals.kcal / calTarget) * 100);

  async function handleSave() {
    setSaving(true);
    setToast('');
    try {
      await api.updateDay(dayIdx, {
        meals,
        water_liters: water,
        weight_kg: weight ? parseFloat(weight) : null,
        notes,
      });
      setToast('Saved!');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setToast(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateMeal(key, items) {
    setMeals(prev => ({ ...prev, [key]: items }));
  }

  if (showProgrammeSetup) {
    return <ProgrammeSetup
      initialProgramme={config?.programme}
      onSkip={() => setShowProgrammeSetup(false)}
      onDone={() => { setShowProgrammeSetup(false); window.location.reload(); }}
    />;
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-600 font-semibold">Loading today…</div>
        </div>
      </div>
    );
  }

  const progEmoji = config?.programme === 'weight_loss' ? '📉' : config?.programme === 'muscle_gain' ? '💪' : '⚖️';
  const progName = config?.programme === 'weight_loss' ? 'Weight Loss' : config?.programme === 'muscle_gain' ? 'Muscle Gain' : 'Recomposition';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <div className="text-2xl">{progEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 truncate">{progName}</div>
          <div className="text-xs text-gray-500">Day {dayIdx + 1}</div>
        </div>
        <button
          onClick={() => setShowProgrammeSetup(true)}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl"
        >
          ⚙️ Programme
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">@{user?.username}</span>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold">Log out</button>
        </div>
        <button onClick={onLogout} className="sm:hidden text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold">Log out</button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* Calorie ring summary */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-6 mb-5">
          <div className="text-center">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Calories Today</div>
            <div className="flex items-baseline justify-center gap-2 mt-1">
              <span className="text-5xl font-extrabold text-gray-800">{Math.round(totals.kcal)}</span>
              <span className="text-lg text-gray-400">/ {calTarget}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">{Math.round(caloriesRemaining)} kcal remaining</div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${caloriePct}%` }} />
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <MacroProgressCard consumed={totals.protein} target={protTarget} label="Protein" color="red" />
          <MacroProgressCard consumed={totals.carbs} target={carbTarget} label="Carbs" color="amber" />
          <MacroProgressCard consumed={totals.fat} target={fatTarget} label="Fat" color="blue" />
        </div>

        {/* Meals */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-4 sm:p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">🍽️ Meals</h2>
          <div className="space-y-2">
            {Object.entries(MEAL_NAMES).map(([key, label]) => {
              const items = meals[key] || [];
              const t = computeMealTotals(items, foodDb);
              const isOpen = expandedMeal === key;
              return (
                <div key={key} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedMeal(isOpen ? null : key)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="text-left">
                      <div className="font-bold text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · {Math.round(t.kcal)} kcal</div>
                    </div>
                    <div className="text-gray-400 text-xl">{isOpen ? '−' : '+'}</div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
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

        {/* Water + weight + notes */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-6 mb-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">💧 Water (L)</label>
              <input type="number" step="0.25" value={water} onChange={e => setWater(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">⚖️ Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">📝 Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-400 resize-none" />
          </div>
        </div>
      </main>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t-2 border-gray-100 shadow-2xl px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {toast && <div className={`text-sm font-semibold ${toast === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{toast}</div>}
          <button onClick={handleSave} disabled={saving}
            className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
