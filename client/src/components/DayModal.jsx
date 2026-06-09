import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDay, calculateScore, WATER_GOALS, MACRO_TARGETS } from '../lib/calories';
import { formatDate } from '../lib/format';
import MealComposer from './MealComposer';
import MealSuggester from './MealSuggester';
import WorkoutLogger from './WorkoutLogger';

const TYPE_CONFIG = {
  low:  { gradient: 'from-rose-500 to-red-600',      bg: 'bg-rose-50',  icon: '🔴' },
  med:  { gradient: 'from-amber-400 to-orange-500',   bg: 'bg-amber-50', icon: '🟡' },
  high: { gradient: 'from-emerald-400 to-green-500',  bg: 'bg-green-50', icon: '🟢' },
};

const MOODS = ['great', 'good', 'ok', 'tired', 'bad'];
const MOOD_EMOJI = { great: '😄', good: '🙂', ok: '😐', tired: '😴', bad: '😞' };
const CHEAT_KCAL = { kabab: 1550, pizza: 1800, burger: 1050, pasta: 950, baguette: 800, other: 0 };
const EMPTY_MEALS = { meal1: [], meal2: [], meal3: [], meal4: [] };

const CHEAT_OPTIONS = [
  { id: 'kabab', emoji: '🥩' },
  { id: 'pizza', emoji: '🍕' },
  { id: 'burger', emoji: '🍔' },
  { id: 'pasta', emoji: '🍝' },
  { id: 'baguette', emoji: '🥖' },
  { id: 'other', emoji: '🍽️' },
];

function localizedScoreLabel(t, score) {
  if (score === 5) return t('score.perfect');
  if (score >= 3) return t('score.good');
  return t('score.weak');
}

export default function DayModal({ dayIndex, scheduleDay, dayLog, days, onSave, onClose, todayIndex, presets = [], onSavePreset, onDeletePreset, allFoods, onCreateCustomFood, onDeleteCustomFood }) {
  const { t } = useTranslation();
  const isFuture = dayIndex > todayIndex;
  const { day_type, phase, date } = scheduleDay;
  const waterGoal = WATER_GOALS[day_type];
  const cfg = TYPE_CONFIG[day_type];

  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [water, setWater]     = useState(0);
  const [workout, setWorkout] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [mood, setMood]       = useState(null);
  const [energy, setEnergy]   = useState(null);
  const [weight, setWeight]   = useState('');
  const [waist, setWaist]     = useState('');
  const [chest, setChest]     = useState('');
  const [arm, setArm]         = useState('');
  const [thigh, setThigh]     = useState('');
  const [cheat, setCheat]     = useState(false);
  const [cheatMealChoice, setCheatMealChoice] = useState(null);
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    if (dayLog) {
      const mj = dayLog.meals_json || {};
      setMeals({ meal1: mj.meal1 || [], meal2: mj.meal2 || [], meal3: mj.meal3 || [], meal4: mj.meal4 || [] });
      setWater(dayLog.water_liters);
      setWorkout(dayLog.workout_done);
      setWorkoutExercises(dayLog.workout_json || []);
      setMood(dayLog.mood);
      setEnergy(dayLog.energy_level);
      setWeight(dayLog.weight_kg != null ? String(dayLog.weight_kg) : '');
      setWaist(dayLog.waist_cm != null ? String(dayLog.waist_cm) : '');
      setChest(dayLog.chest_cm != null ? String(dayLog.chest_cm) : '');
      setArm(dayLog.arm_cm != null ? String(dayLog.arm_cm) : '');
      setThigh(dayLog.thigh_cm != null ? String(dayLog.thigh_cm) : '');
      setCheat(dayLog.cheat_meal);
      const rawNotes = dayLog.notes || '';
      const cheatMatch = rawNotes.match(/^\[cheat:([^\]]+)\]\n?/);
      if (cheatMatch) {
        setCheatMealChoice(cheatMatch[1]);
        setNotes(rawNotes.replace(/^\[cheat:[^\]]+\]\n?/, ''));
      } else {
        setCheatMealChoice(null);
        setNotes(rawNotes);
      }
    } else {
      setMeals(EMPTY_MEALS);
    }
  }, [dayLog]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cheatKcal = cheat && cheatMealChoice ? (CHEAT_KCAL[cheatMealChoice] || 0) : 0;
  const baseCal = useMemo(() => calculateDay(day_type, meals, workout), [day_type, meals, workout]);
  const cal = useMemo(() => ({
    ...baseCal,
    calories_consumed: baseCal.calories_consumed + cheatKcal,
    calories_remaining: baseCal.calories_remaining - cheatKcal,
  }), [baseCal, cheatKcal]);
  const score = useMemo(() => calculateScore(day_type, cal.meal1_done, cal.meal2_done, cal.meal3_done, cal.meal4_done, water), [day_type, cal, water]);

  const prevDayMeals = useMemo(() => {
    if (dayIndex <= 0) return null;
    const prev = days[dayIndex - 1];
    if (!prev?.meals_json) return null;
    const mj = prev.meals_json;
    return ['meal1','meal2','meal3','meal4'].some(k => (mj[k]?.length ?? 0) > 0) ? mj : null;
  }, [days, dayIndex]);

  function copyFromYesterday() {
    if (!prevDayMeals) return;
    setMeals({ meal1: prevDayMeals.meal1 || [], meal2: prevDayMeals.meal2 || [], meal3: prevDayMeals.meal3 || [], meal4: prevDayMeals.meal4 || [] });
  }

  const weekStart = Math.floor(dayIndex / 7) * 7;
  const cheatLockedByOther = useMemo(() => {
    for (let i = weekStart; i < weekStart + 7 && i <= 55; i++) {
      if (i !== dayIndex && days[i]?.cheat_meal) return true;
    }
    return false;
  }, [days, weekStart, dayIndex]);

  const calPct = cal.calories_target > 0 ? Math.min(100, Math.round((cal.calories_consumed / cal.calories_target) * 100)) : 0;
  const mt = MACRO_TARGETS[day_type];

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(dayIndex, {
        meals, water_liters: water, workout_done: workout, workout_json: workoutExercises,
        mood, energy_level: energy, weight_kg: weight ? parseFloat(weight) : null,
        waist_cm: waist ? parseFloat(waist) : null, chest_cm: chest ? parseFloat(chest) : null,
        arm_cm: arm ? parseFloat(arm) : null, thigh_cm: thigh ? parseFloat(thigh) : null,
        cheat_meal: cheat, cheat_kcal: cheatKcal,
        notes: cheat && cheatMealChoice
          ? `[cheat:${cheatMealChoice}]${notes ? '\n' + notes : ''}`
          : notes || null,
      });
      const msg = score === 5 ? t('modal.toastPerfect') : score >= 3 ? t('modal.toastGood') : t('modal.toastSaved');
      setToast(msg);
      setTimeout(() => onClose(), 1200);
    } catch (err) { console.error('Save failed:', err); }
    finally { setSaving(false); }
  }

  const formatted = formatDate(date + 'T12:00:00', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const tip = (() => {
    const proteinLeft = mt.protein_g - cal.protein_g;
    const carbsLeft = mt.carbs_g - cal.carbs_g;
    if (cal.calories_consumed === 0) {
      return day_type === 'low' ? t('modal.tip.lowEmpty')
        : day_type === 'med' ? t('modal.tip.medEmpty')
        : t('modal.tip.highEmpty');
    }
    if (proteinLeft > 20) return t('modal.tip.proteinNeeded', { g: proteinLeft });
    if (day_type === 'low' && cal.carbs_g > mt.carbs_g * 0.85) return t('modal.tip.carbsNearLimit');
    if (carbsLeft > 50 && day_type !== 'low') return t('modal.tip.carbsRemaining', { g: carbsLeft });
    return t('modal.tip.balanced');
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.gradient} text-white px-5 py-4 shrink-0`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{t('modal.dayNum', { num: dayIndex + 1 })}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">{t(`dayType.${day_type}`)}</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">{t('modal.dateAndPhase', { date: formatted, phase, goal: t(`phaseGoal.${phase}`) })}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">×</button>
          </div>

          {/* Inline calorie + macro bar */}
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{cal.calories_consumed}</span>
                <span className="text-xs text-white/60">/ {cal.calories_target} {t('macro.kcal')}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                calPct >= 100 ? 'bg-green-400/30 text-green-100' : 'bg-white/15 text-white/80'
              }`}>
                {cal.calories_remaining > 0 ? t('modal.kcalLeft', { kcal: cal.calories_remaining }) : t('modal.targetHit')}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
              <div className={`rounded-full h-1.5 transition-all duration-500 ${calPct >= 100 ? 'bg-green-300' : 'bg-white/70'}`} style={{ width: `${calPct}%` }} />
            </div>
            <div className="flex gap-3">
              {[
                { labelKey: 'macro.protein_short', val: cal.protein_g, target: mt.protein_g, color: 'bg-red-300' },
                { labelKey: 'macro.carbs_short',   val: cal.carbs_g,   target: mt.carbs_g,   color: 'bg-amber-300' },
                { labelKey: 'macro.fat_short',     val: cal.fat_g,     target: mt.fat_g,     color: 'bg-blue-300' },
              ].map(m => (
                <div key={m.labelKey} className="flex-1">
                  <div className="flex justify-between text-[10px] text-white/70 mb-0.5">
                    <span className="font-bold">{t(m.labelKey)}</span>
                    <span>{m.val}/{m.target}g</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1">
                    <div className={`${m.color} h-1 rounded-full transition-all duration-300`} style={{ width: `${Math.min(100, Math.round((m.val / m.target) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart tip */}
        <div className="px-5 py-2 bg-indigo-50 text-indigo-600 text-xs font-medium shrink-0">
          💡 {tip}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isFuture && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
              {t('modal.previewMode')}
            </div>
          )}

          {/* Meals */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">{t('modal.meals')}</h3>
              {!isFuture && prevDayMeals && (
                <button onClick={copyFromYesterday}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                  {t('modal.copyYesterday')}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {['meal1', 'meal2', 'meal3', 'meal4'].map((key, i) => (
                <MealComposer
                  key={key}
                  mealNum={i + 1}
                  items={meals[key]}
                  onChange={newItems => !isFuture && setMeals(prev => ({ ...prev, [key]: newItems }))}
                  disabled={isFuture}
                  presets={presets}
                  onSavePreset={onSavePreset}
                  onDeletePreset={onDeletePreset}
                  allFoods={allFoods}
                  onCreateCustomFood={onCreateCustomFood}
                  onDeleteCustomFood={onDeleteCustomFood}
                />
              ))}
            </div>

            {/* AI Meal Suggester */}
            {!isFuture && (
              <MealSuggester
                remainingProtein={mt.protein_g - cal.protein_g}
                remainingCarbs={mt.carbs_g - cal.carbs_g}
                remainingFat={mt.fat_g - cal.fat_g}
                remainingKcal={cal.calories_remaining}
                onAddItems={(items) => {
                  const slot = ['meal1', 'meal2', 'meal3', 'meal4'].find(k => meals[k].length === 0) || 'meal4';
                  setMeals(prev => ({ ...prev, [slot]: [...prev[slot], ...items] }));
                }}
              />
            )}
          </div>

          {/* Water */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">{t('modal.water')}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-lg font-bold ${water >= waterGoal ? 'text-cyan-500' : 'text-gray-700'}`}>{water.toFixed(1)}L</span>
                <span className="text-xs text-gray-400">/ {waterGoal}L</span>
                {water >= waterGoal && <span className="text-green-500 text-sm font-bold">✓</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => !isFuture && setWater(w => Math.max(0, +(w - 0.25).toFixed(2)))}
                disabled={isFuture || water <= 0}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-cyan-100 text-gray-600 font-bold flex items-center justify-center disabled:opacity-30 transition-colors text-lg">−</button>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-300 ${water >= waterGoal ? 'bg-cyan-500' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, (water / waterGoal) * 100)}%` }} />
              </div>
              <button onClick={() => !isFuture && setWater(w => +(w + 0.25).toFixed(2))}
                disabled={isFuture}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-cyan-100 text-gray-600 font-bold flex items-center justify-center disabled:opacity-30 transition-colors text-lg">+</button>
            </div>
          </div>

          {/* Workout */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">{t('modal.workout')}</span>
              <button
                onClick={() => !isFuture && setWorkout(w => !w)}
                disabled={isFuture}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all border-2 ${
                  workout ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-400 hover:border-purple-200'
                } disabled:opacity-40`}
              >
                {workout ? t('modal.trainedToday') : t('modal.restDay')}
              </button>
            </div>
            {workout && (
              <WorkoutLogger
                exercises={workoutExercises}
                onChange={exs => !isFuture && setWorkoutExercises(exs)}
                disabled={isFuture}
              />
            )}
          </div>

          {/* Cheat Meal */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <button
              onClick={() => !isFuture && !cheatLockedByOther && setCheat(c => !c)}
              disabled={isFuture || (cheatLockedByOther && !cheat)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                cheat ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-400'
              } disabled:opacity-40`}
            >
              <span className="text-xl">🍕</span>
              {cheat ? t('modal.cheatMealOn') : cheatLockedByOther ? t('modal.cheatUsedThisWeek') : t('modal.cheatPrompt')}
            </button>

            {cheat && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">{t('modal.cheatQuestion')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHEAT_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => !isFuture && setCheatMealChoice(prev => prev === m.id ? null : m.id)}
                      disabled={isFuture}
                      className={`text-start p-2.5 rounded-xl border-2 transition-all ${
                        cheatMealChoice === m.id
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-100 bg-gray-50 hover:border-orange-200'
                      } disabled:opacity-40`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-xs font-bold text-gray-700 leading-tight">{t(`modal.cheat.${m.id}`)}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-orange-500 ms-6">{t(`modal.cheat.${m.id}_kcal`)}</div>
                    </button>
                  ))}
                </div>
                {cheatMealChoice && cheatMealChoice !== 'other' && (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700 font-medium">
                    {t('modal.cheatWarning')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mood */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-sm font-bold text-gray-700 mb-3 block">{t('modal.howFeel')}</span>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button key={m}
                  onClick={() => !isFuture && setMood(mood === m ? null : m)}
                  disabled={isFuture}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all border-2 ${
                    mood === m
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                      : 'border-gray-100 hover:border-gray-300 bg-gray-50'
                  } disabled:opacity-40`}>
                  <span className="text-2xl">{MOOD_EMOJI[m]}</span>
                  <span className="text-[10px] font-semibold text-gray-500 mt-1">{t(`modal.mood.${m}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">{t('modal.energyLevel')}</span>
              <span className="text-2xl font-bold text-orange-500">{energy ?? '—'}<span className="text-xs text-gray-400 ms-0.5">{t('modal.energyOf10')}</span></span>
            </div>
            <input type="range" min="1" max="10" value={energy ?? 5}
              onChange={e => !isFuture && setEnergy(parseInt(e.target.value))}
              disabled={isFuture}
              className="w-full accent-orange-500 disabled:opacity-40" />
            <div className="flex justify-between text-xs text-gray-400 font-medium mt-1"><span>{t('modal.energyLow')}</span><span>{t('modal.energyHigh')}</span></div>
          </div>

          {/* Weigh-In */}
          {[0, 13, 27, 41, 55].includes(dayIndex) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-700">{t('modal.weighIn')}</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                  {dayIndex === 0 ? t('modal.initialWeight') : t('modal.endOfWeek', { num: Math.ceil((dayIndex + 1) / 7) })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{t('modal.morningWeight')}</p>
              <input type="number" step="0.1" value={weight}
                onChange={e => !isFuture && setWeight(e.target.value)}
                disabled={isFuture} placeholder={t('modal.weightPlaceholder')}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-40" />

              {/* Body Measurements */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-700 mb-3 block">{t('modal.bodyMeasurements')}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('modal.waist')}</label>
                    <input type="number" step="0.1" value={waist}
                      onChange={e => !isFuture && setWaist(e.target.value)}
                      disabled={isFuture} placeholder={t('modal.cmPlaceholder')}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('modal.chest')}</label>
                    <input type="number" step="0.1" value={chest}
                      onChange={e => !isFuture && setChest(e.target.value)}
                      disabled={isFuture} placeholder={t('modal.cmPlaceholder')}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('modal.arm')}</label>
                    <input type="number" step="0.1" value={arm}
                      onChange={e => !isFuture && setArm(e.target.value)}
                      disabled={isFuture} placeholder={t('modal.cmPlaceholder')}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('modal.thigh')}</label>
                    <input type="number" step="0.1" value={thigh}
                      onChange={e => !isFuture && setThigh(e.target.value)}
                      disabled={isFuture} placeholder={t('modal.cmPlaceholder')}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-40" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-sm font-bold text-gray-700 mb-2 block">{t('modal.notes')}</span>
            <textarea value={notes} onChange={e => !isFuture && setNotes(e.target.value)}
              disabled={isFuture} rows={3}
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none disabled:opacity-40 bg-gray-50 placeholder-gray-400 resize-none"
              placeholder={t('modal.notesPlaceholder')} />
          </div>

          {/* Score */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-700 mb-2">{t('modal.dayScore')}</div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-full transition-all ${i <= score ? 'bg-yellow-400 shadow-sm scale-110' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
            <div className="text-end">
              <div className="text-4xl font-bold text-purple-600">{score}<span className="text-lg text-gray-300">{t('modal.scoreOfMax')}</span></div>
              <div className="text-xs font-bold text-purple-400 mt-0.5">{localizedScoreLabel(t, score)}</div>
            </div>
          </div>
        </div>

        {/* Save Footer */}
        {!isFuture && (
          <div className="px-4 py-3 bg-gray-100 shrink-0">
            <button onClick={handleSave} disabled={saving || !!toast}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl text-base transition-all disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-[0.98]">
              {saving ? t('modal.saving') : t('modal.saveDay')}
            </button>
          </div>
        )}

        {/* Toast overlay */}
        {toast && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl z-10 animate-fadeIn">
            <div className={`px-8 py-6 rounded-2xl shadow-2xl text-center ${
              score === 5 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-green-400 to-emerald-500'
            }`}>
              <div className="text-4xl mb-2">{score === 5 ? '🎉' : '✅'}</div>
              <div className="text-white text-lg font-bold">{toast}</div>
              <div className="text-white/70 text-sm mt-1">{t('modal.toastScore', { score })}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
