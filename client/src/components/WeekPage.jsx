import { useState } from 'react';
import DayCard from './DayCard';
import { CALORIE_TARGETS, WATER_GOALS, scoreLabel } from '../lib/calories';
import { FOODS, sumMealNutrition } from '../lib/foods';

// Suggested templates per day type
const SUGGESTED_MEALS = {
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

const PHASE_CONFIG = {
  1: {
    color: 'from-blue-500 to-blue-700',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: '🚀',
    goal: 'Adaptation',
    description: 'Your body is adapting to carb cycling. Focus on learning the meal structure and hitting your water goals every day.',
    tips: [
      'Eat meals at consistent times',
      'Prioritize sleep (7–8 hrs) for adaptation',
      'Track water every day — it matters',
      'Workouts on Medium carb days only',
    ],
  },
  2: {
    color: 'from-red-500 to-red-700',
    lightBg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: '📉',
    goal: 'Fat Loss Increase',
    description: 'More Low carb days intensify the fat-burning stimulus. You have fewer workouts this phase — that is intentional.',
    tips: [
      'Stay disciplined on Low carb days',
      'Fewer workouts = strategic deficit days',
      'Medium day workouts are more important now',
      'Manage hunger with extra cucumber/water',
    ],
  },
  3: {
    color: 'from-orange-500 to-orange-700',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: '🔥',
    goal: 'Strong Fat Burning',
    description: 'The hardest phase — 6 consecutive Low carb days before each Medium. This is where the most fat loss happens.',
    tips: [
      'Push through the Low day stretches',
      'The Medium day is your reward — use it well',
      'Stay consistent with meals even if hungry',
      'Log everything — accountability matters most here',
    ],
  },
  4: {
    color: 'from-purple-500 to-purple-700',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: '💪',
    goal: 'Recovery & Performance',
    description: 'Metabolic recovery in Week 7 with High carb days, then performance peaking in Week 8. Your body is ready to go.',
    tips: [
      'High carb days are full recovery — no workouts',
      'Enjoy the higher calories — they are part of the plan',
      'Week 8 builds into a strong performance finish',
      'Log your weight daily — track the rebound and settle',
    ],
  },
};

const TYPE_EMOJI = { low: '🔴', med: '🟡', high: '🟢' };
const TYPE_LABEL = { low: 'Low', med: 'Medium', high: 'High' };
const TYPE_COLOR = {
  low: 'bg-red-100 text-red-700 border-red-300',
  med: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-green-100 text-green-700 border-green-300',
};

export default function WeekPage({ weekNum, schedule, days, stats, todayIndex, onDayClick, onSelectWeek }) {
  const [activeTab, setActiveTab] = useState('days');

  const weekStart = (weekNum - 1) * 7;
  const weekDays = schedule.slice(weekStart, Math.min(weekStart + 7, 56));
  if (weekDays.length === 0) return null;

  const phase = weekDays[0].phase;
  const cfg = PHASE_CONFIG[phase];
  const weekStats = stats?.weekly_summary?.find(ws => ws.week_number === weekNum);

  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;
  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const completed = weekStats?.completed_days ?? 0;
  const goodDays = weekStats?.good_days ?? 0;
  const perfect = weekStats?.perfect_days ?? 0;
  const workouts = weekStats?.workout_days ?? 0;
  const workoutGoal = weekStats?.workout_goal ?? 0;
  const cheatUsed = weekStats?.cheat_used ?? false;

  const lowCount = weekDays.filter(d => d.day_type === 'low').length;
  const medCount = weekDays.filter(d => d.day_type === 'med').length;
  const highCount = weekDays.filter(d => d.day_type === 'high').length;

  // Average cals consumed this week
  const weekLogs = weekDays.map(d => days[d.day_index]).filter(Boolean);
  const avgCals = weekLogs.length
    ? Math.round(weekLogs.reduce((s, l) => s + l.calories_consumed, 0) / weekLogs.length)
    : 0;
  const totalWater = weekLogs.reduce((s, l) => s + l.water_liters, 0);

  const tabs = [
    { key: 'days', label: '📅 Daily Log', emoji: '📅' },
    { key: 'plan', label: '🍽️ Meal Plan', emoji: '🍽️' },
    { key: 'workouts', label: '💪 Workouts', emoji: '💪' },
    { key: 'stats', label: '📊 Stats', emoji: '📊' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Week hero header */}
      <div className={`bg-gradient-to-r ${cfg.color} text-white rounded-3xl shadow-2xl p-8 mb-8`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl">{cfg.icon}</span>
              <div>
                <h1 className="text-4xl font-bold">Week {weekNum}</h1>
                <p className="text-white/80 text-lg">Phase {phase} — {cfg.goal}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm max-w-lg">{cfg.description}</p>
            <p className="text-white/60 text-xs mt-2">
              {fmtDate(startDate)} — {fmtDate(endDate)}
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Logged', value: `${completed}/7`, sub: 'days' },
              { label: 'Good Days', value: `${goodDays}/7`, sub: 'score ≥3' },
              { label: 'Workouts', value: `${workouts}/${workoutGoal}`, sub: 'done' },
              { label: 'Avg Cal', value: avgCals || '—', sub: 'kcal/day' },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/70 font-semibold uppercase">{s.label}</div>
                <div className="text-xs text-white/50">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Week progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-white/80 font-semibold mb-2">
            <span>Week Progress</span>
            <span>{Math.round((completed / 7) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-700"
              style={{ width: `${Math.round((completed / 7) * 100)}%` }}
            />
          </div>
        </div>

        {/* Prev / Next week navigation */}
        {onSelectWeek && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/20">
            <button
              onClick={() => onSelectWeek(weekNum - 1)}
              disabled={weekNum <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Week {weekNum - 1}
            </button>
            <span className="text-white/50 text-xs font-semibold">Week {weekNum} of 8</span>
            <button
              onClick={() => onSelectWeek(weekNum + 1)}
              disabled={weekNum >= 8}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Week {weekNum + 1} →
            </button>
          </div>
        )}
      </div>

      {/* Day type breakdown pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: 'low', count: lowCount },
          { type: 'med', count: medCount },
          ...(highCount > 0 ? [{ type: 'high', count: highCount }] : []),
        ].map(({ type, count }) => (
          <div key={type} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold ${TYPE_COLOR[type]}`}>
            {TYPE_EMOJI[type]} {count}× {TYPE_LABEL[type]} Carb
          </div>
        ))}
        {cheatUsed && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-orange-100 text-orange-700 border-orange-300 font-semibold">
            🍕 Cheat meal used
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              activeTab === t.key
                ? 'bg-white text-gray-800 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Daily Log */}
      {activeTab === 'days' && (
        <div className="animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDays.map(sd => (
              <DayCard
                key={sd.day_index}
                scheduleDay={sd}
                dayLog={days[sd.day_index]}
                isToday={sd.day_index === todayIndex}
                onClick={() => onDayClick(sd.day_index)}
              />
            ))}
          </div>

          {/* Detailed day list */}
          <div className="mt-6 space-y-2">
            {weekDays.map(sd => {
              const log = days[sd.day_index];
              const isTodayDay = sd.day_index === todayIndex;
              const isFuture = sd.day_index > todayIndex;
              return (
                <button
                  key={sd.day_index}
                  onClick={() => onDayClick(sd.day_index)}
                  className={`w-full flex flex-wrap items-center gap-4 bg-white rounded-xl border-2 p-4 hover:shadow-md transition-all text-left ${
                    isTodayDay ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-100'
                  } ${isFuture ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                      sd.day_type === 'low' ? 'bg-red-100 text-red-700' :
                      sd.day_type === 'med' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {sd.day_index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">Day {sd.day_index + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${TYPE_COLOR[sd.day_type]}`}>
                          {TYPE_EMOJI[sd.day_type]} {TYPE_LABEL[sd.day_type]}
                        </span>
                        {isTodayDay && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-lg font-bold">TODAY</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(sd.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>

                  {log ? (
                    <div className="flex flex-wrap items-center gap-3 ml-auto text-sm">
                      {/* Meal dots */}
                      <div className="flex gap-1.5">
                        {[log.meal1_done, log.meal2_done, log.meal3_done, log.meal4_done].map((m, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full ${m ? 'bg-green-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-gray-600">💧 {log.water_liters}L</span>
                      <span className="text-gray-600">🔥 {log.calories_consumed} kcal</span>
                      {log.workout_done && <span className="text-purple-600 font-semibold">💪 Workout</span>}
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        log.score === 5 ? 'bg-green-100 text-green-700' :
                        log.score >= 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.score}/5 {scoreLabel(log.score)}
                      </span>
                    </div>
                  ) : (
                    <div className="ml-auto text-sm text-gray-400 italic">
                      {isFuture ? 'Future day' : 'Not logged yet — click to log'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Meal Plan */}
      {activeTab === 'plan' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            <strong>💡 These are suggested templates.</strong> Open any day card to compose your own meals freely — choose any food, any gram amount.
          </div>
          {['low', 'med', 'high'].filter(t => weekDays.some(d => d.day_type === t)).map(dayType => {
            const suggested = SUGGESTED_MEALS[dayType];
            const typeDays = weekDays.filter(d => d.day_type === dayType).map(d => d.day_index + 1);
            const headerCls = dayType === 'low' ? 'bg-gradient-to-r from-red-500 to-red-600' : dayType === 'med' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-green-600';
            const borderCls = dayType === 'low' ? 'border-red-200' : dayType === 'med' ? 'border-yellow-200' : 'border-green-200';
            const dayTotal = Math.round(Object.values(suggested).reduce((s, items) => s + sumMealNutrition(items).kcal, 0));
            return (
              <div key={dayType} className={`bg-white rounded-2xl border-2 ${borderCls} shadow-lg overflow-hidden`}>
                <div className={`px-5 py-4 ${headerCls} text-white`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-bold">{TYPE_EMOJI[dayType]} {TYPE_LABEL[dayType]} Carb Day</h3>
                      <p className="text-white/80 text-sm">Days: {typeDays.join(', ')} · Target ≈{CALORIE_TARGETS[dayType]} kcal</p>
                    </div>
                    <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                      <div className="text-2xl font-bold">~{dayTotal}</div>
                      <div className="text-xs text-white/80">suggested kcal</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['meal1', 'meal2', 'meal3', 'meal4'].map((mk, i) => {
                      const items = suggested[mk];
                      const mKcal = Math.round(sumMealNutrition(items).kcal);
                      return (
                        <div key={mk} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-sm text-gray-800">Meal {i + 1}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${TYPE_COLOR[dayType]}`}>~{mKcal} kcal</span>
                          </div>
                          <div className="space-y-0.5">
                            {items.map((item, j) => {
                              const f = FOODS[item.food_id];
                              return (
                                <div key={j} className="text-xs text-gray-600 flex items-center gap-1">
                                  <span>{f?.emoji}</span>
                                  <span>{item.amount}{f?.unit === 'g' ? 'g' : f?.unit === 'piece' ? '×' : ' pot'} {f?.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex flex-wrap gap-3 ${dayType === 'low' ? 'bg-red-50 text-red-700' : dayType === 'med' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                    <span>💧 Water: {WATER_GOALS[dayType]}L</span>
                    <span>🎯 Target: {CALORIE_TARGETS[dayType]} kcal</span>
                    {dayType === 'med' && <span>💪 +200 kcal with workout</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Workouts */}
      {activeTab === 'workouts' && (
        <div className="animate-fadeIn space-y-4">
          <div className={`${cfg.lightBg} border-2 ${cfg.border} rounded-2xl p-5`}>
            <h3 className={`text-lg font-bold ${cfg.text} mb-2 flex items-center gap-2`}>
              <span>ℹ️</span> Workout Rule This Phase
            </h3>
            <p className="text-gray-700 text-sm">
              Workouts are only on <strong>Medium carb days</strong>. This week has <strong>{workoutGoal} Medium day{workoutGoal !== 1 ? 's' : ''}</strong>, so your workout target is <strong>{workoutGoal} workout{workoutGoal !== 1 ? 's' : ''}</strong>.
              When completed, each workout adds <strong>+200 kcal</strong> to your daily target.
            </p>
          </div>

          {/* Per-day workout status */}
          <div className="space-y-2">
            {weekDays.map(sd => {
              const log = days[sd.day_index];
              const isWorkoutDay = sd.day_type === 'med';
              const workoutDone = log?.workout_done;
              const isTodayDay = sd.day_index === todayIndex;
              const isFuture = sd.day_index > todayIndex;
              const dateLabel = new Date(sd.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

              return (
                <div
                  key={sd.day_index}
                  className={`flex items-center gap-4 bg-white rounded-xl border-2 p-4 ${
                    isTodayDay ? 'border-indigo-400' :
                    isWorkoutDay ? 'border-gray-200' : 'border-gray-100'
                  } ${isFuture ? 'opacity-60' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
                    !isWorkoutDay ? 'bg-gray-100 text-gray-400' :
                    workoutDone ? 'bg-green-100 text-green-700' :
                    !isFuture && !log ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {!isWorkoutDay ? (sd.day_type === 'high' ? '🟢' : '🔴') :
                     workoutDone ? '✅' : isFuture ? '⏳' : '⬜'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">Day {sd.day_index + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${TYPE_COLOR[sd.day_type]}`}>
                        {TYPE_EMOJI[sd.day_type]} {TYPE_LABEL[sd.day_type]}
                      </span>
                      {isTodayDay && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-lg font-bold">TODAY</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{dateLabel}</div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {!isWorkoutDay ? (
                      <span className="text-gray-400">{sd.day_type === 'high' ? 'Rest (recovery)' : 'Rest (deficit)'}</span>
                    ) : workoutDone ? (
                      <span className="text-green-600">💪 Done +200 kcal</span>
                    ) : isFuture ? (
                      <span className="text-gray-400">Upcoming</span>
                    ) : (
                      <button
                        onClick={() => onDayClick(sd.day_index)}
                        className="text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Log workout
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phase tips */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-md">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💡</span> Tips for Phase {phase}
            </h3>
            <ul className="space-y-2">
              {cfg.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className={`mt-0.5 w-5 h-5 rounded-full ${cfg.lightBg} ${cfg.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="animate-fadeIn space-y-4">
          {/* Summary numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Days Logged', value: `${completed}/7`, icon: '✅', color: 'from-blue-500 to-blue-600' },
              { label: 'Perfect Days', value: perfect, icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
              { label: 'Workouts Done', value: `${workouts}/${workoutGoal}`, icon: '💪', color: 'from-purple-500 to-purple-600' },
              { label: 'Total Water', value: totalWater > 0 ? `${totalWater.toFixed(1)}L` : '—', icon: '💧', color: 'from-cyan-500 to-cyan-600' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-5 shadow-lg`}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/70 font-semibold uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-day breakdown table */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Day</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Calories</th>
                    <th className="px-4 py-3 text-right">Water</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-center">Workout</th>
                    <th className="px-4 py-3 text-left">Mood</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weekDays.map(sd => {
                    const log = days[sd.day_index];
                    const isTodayDay = sd.day_index === todayIndex;
                    return (
                      <tr
                        key={sd.day_index}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isTodayDay ? 'bg-indigo-50' : ''}`}
                        onClick={() => onDayClick(sd.day_index)}
                      >
                        <td className="px-4 py-3 font-bold text-gray-800">
                          Day {sd.day_index + 1}
                          {isTodayDay && <span className="ml-2 text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-lg font-bold ${TYPE_COLOR[sd.day_type]}`}>
                            {TYPE_EMOJI[sd.day_type]} {TYPE_LABEL[sd.day_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">
                          {log ? `${log.calories_consumed} / ${log.calories_target}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {log ? `${log.water_liters}L` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log ? (
                            <span className={`font-bold ${log.score === 5 ? 'text-green-600' : log.score >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                              {log.score}/5
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sd.day_type === 'med'
                            ? (log?.workout_done ? '✅' : '☐')
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log?.mood ? (
                            <span>{log.mood === 'great' ? '😄' : log.mood === 'good' ? '🙂' : log.mood === 'ok' ? '😐' : log.mood === 'tired' ? '😴' : '😞'} {log.mood}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
