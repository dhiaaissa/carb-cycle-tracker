import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Barbell, Clock, Check, Info } from '@phosphor-icons/react';
import { DEFAULT_DAY_TARGETS, WATER_GOALS } from '../lib/calories';
import { FOODS, sumMealNutrition } from '../lib/foods';
import { formatDate, formatNumber } from '../lib/format';
import { PageHeader, Pager, Panel, Ledger, Tabs, DayTypeChip, DayTypeSwatch, TextButton } from './ui/primitives';

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

const MOOD_EMOJI = { great: '😄', good: '🙂', ok: '😐', tired: '😴', bad: '😞' };

function scoreLabel(t, score) {
  if (score === 5) return t('score.perfect');
  if (score >= 3) return t('score.good');
  return t('score.weak');
}

export default function WeekPage({ weekNum, schedule, days, stats, todayIndex, onDayClick, onSelectWeek, dayTargets = DEFAULT_DAY_TARGETS }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('days');

  const weekDays = schedule.slice((weekNum - 1) * 7, Math.min(weekNum * 7, 56));
  if (weekDays.length === 0) return null;

  const phase = weekDays[0].phase;
  const weekStats = stats?.weekly_summary?.find((ws) => ws.week_number === weekNum);
  const fmt = (d, opts) => formatDate(d + 'T12:00:00', opts);

  const completed = weekStats?.completed_days ?? 0;
  const goodDays = weekStats?.good_days ?? 0;
  const perfect = weekStats?.perfect_days ?? 0;
  const workouts = weekStats?.workout_days ?? 0;
  const workoutGoal = weekStats?.workout_goal ?? 0;
  const cheatUsed = weekStats?.cheat_used ?? false;

  const counts = ['low', 'med', 'high'].map((type) => [type, weekDays.filter((d) => d.day_type === type).length]).filter(([, n]) => n);
  const weekLogs = weekDays.map((d) => days[d.day_index]).filter(Boolean);
  const avgCals = weekLogs.length ? Math.round(weekLogs.reduce((s, l) => s + l.calories_consumed, 0) / weekLogs.length) : 0;
  const totalWater = weekLogs.reduce((s, l) => s + l.water_liters, 0);

  const tabs = ['days', 'plan', 'workouts', 'stats'].map((key) => ({ key, label: t(`weekPage.tab.${key}`) }));

  return (
    <div>
      <PageHeader
        eyebrow={`${t('weekPage.heroPhase', { phase, goal: t(`phaseGoalShort.${phase}`) })} · ${fmt(weekDays[0].date, { day: 'numeric', month: 'short' })} – ${fmt(weekDays[weekDays.length - 1].date, { day: 'numeric', month: 'short' })}`}
        title={t('nav.weekNum', { num: weekNum })}
        subtitle={t(`weekPage.phase.${phase}.desc`)}
        actions={onSelectWeek && (
          <Pager
            onPrev={() => onSelectWeek(weekNum - 1)} prevDisabled={weekNum <= 1} prevLabel={t('weekPage.prevWeek', { num: weekNum - 1 })}
            onNext={() => onSelectWeek(weekNum + 1)} nextDisabled={weekNum >= 8} nextLabel={t('weekPage.nextWeek', { num: weekNum + 1 })}
          />
        )}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-ink-600">
          {counts.map(([type, n]) => (
            <span key={type} className="flex items-center gap-1.5"><DayTypeSwatch type={type} />{t('weekPage.typeCount', { count: n, type: t(`dayType.${type}`) })}</span>
          ))}
          {cheatUsed && <span className="text-saffron-700">{t('weekPage.cheatUsedLabel')}</span>}
        </div>
      </PageHeader>

      <Ledger className="mb-8" items={[
        { label: t('weekPage.quickStat.logged'), value: completed, suffix: '/ 7' },
        { label: t('weekPage.quickStat.goodDays'), value: goodDays, suffix: '/ 7' },
        { label: t('weekPage.quickStat.workouts'), value: workouts, suffix: `/ ${workoutGoal}` },
        { label: t('weekPage.quickStat.avgCal'), value: avgCals ? formatNumber(avgCals) : '—', suffix: avgCals ? 'kcal' : '' },
      ]} />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} label={t('nav.weekNum', { num: weekNum })} />

      {activeTab === 'days' && (
        <Panel bodyClassName="">
          <ol className="divide-y divide-ink-200">
            {weekDays.map((sd) => {
              const log = days[sd.day_index];
              const isToday = sd.day_index === todayIndex;
              const isFuture = sd.day_index > todayIndex;
              return (
                <li key={sd.day_index}>
                  <button
                    type="button"
                    onClick={() => onDayClick(sd.day_index)}
                    disabled={isFuture}
                    className={`w-full text-start flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-ink-50 disabled:hover:bg-transparent ${isToday ? 'bg-door-50' : ''}`}
                  >
                    <div className="w-28 shrink-0">
                      <div className="text-sm font-semibold text-ink-900">{fmt(sd.date, { weekday: 'long' })}</div>
                      <div className="text-xs text-ink-500">{t('modal.dayNum', { num: sd.day_index + 1 })} · {fmt(sd.date, { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <DayTypeChip type={sd.day_type} />
                    {isToday && <span className="text-xs font-semibold text-door-700">{t('weekPage.todayBadge')}</span>}

                    {log ? (
                      <div className="ms-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-600 tabular-nums">
                        <span className="flex gap-1" aria-label={t('weekPage.mealsLogged', { count: [log.meal1_done, log.meal2_done, log.meal3_done, log.meal4_done].filter(Boolean).length })}>
                          {[log.meal1_done, log.meal2_done, log.meal3_done, log.meal4_done].map((m, i) => (
                            <span key={i} className={`w-2 h-2 rounded-[2px] ${m ? 'bg-door-600' : 'bg-ink-200'}`} />
                          ))}
                        </span>
                        <span>{t('weekPage.kcal', { kcal: formatNumber(log.calories_consumed) })}</span>
                        <span>{t('weekPage.waterShort', { liters: log.water_liters })}</span>
                        {log.workout_done && <Barbell size={16} weight="bold" className="text-door-600" aria-label={t('day.workoutDone')} />}
                        <span className="font-semibold text-ink-900">{log.score}/5 <span className="font-normal text-ink-500">{scoreLabel(t, log.score)}</span></span>
                      </div>
                    ) : (
                      <span className="ms-auto text-sm text-ink-500">{isFuture ? t('weekPage.futureDay') : t('weekPage.notLoggedYet')}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-5">
          <p className="text-sm text-ink-600 flex gap-2"><Info size={18} className="shrink-0 text-door-600" aria-hidden="true" /><span><strong className="text-ink-900">{t('weekPage.planTip')}</strong>{t('weekPage.planTipRest')}</span></p>
          {['low', 'med', 'high'].filter((ty) => weekDays.some((d) => d.day_type === ty)).map((dayType) => {
            const suggested = SUGGESTED_MEALS[dayType];
            const typeDays = weekDays.filter((d) => d.day_type === dayType).map((d) => d.day_index + 1);
            const dayTotal = Math.round(Object.values(suggested).reduce((s, items) => s + sumMealNutrition(items).kcal, 0));
            return (
              <Panel
                key={dayType}
                title={<span className="flex items-center gap-2"><DayTypeSwatch type={dayType} className="w-3 h-3" />{t(`dayType.${dayType}`)}</span>}
                action={<span className="text-sm text-ink-500 tabular-nums">~{formatNumber(dayTotal)} {t('weekPage.suggestedKcal')}</span>}
              >
                <p className="text-xs text-ink-500 -mt-1 mb-4">{t('weekPage.daysAndTarget', { days: typeDays.join(', '), kcal: dayTargets[dayType]?.calories })}</p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {['meal1', 'meal2', 'meal3', 'meal4'].map((mk, i) => (
                    <div key={mk}>
                      <div className="flex justify-between text-sm border-b border-ink-200 pb-1.5 mb-1.5">
                        <span className="font-semibold text-ink-900">{t('weekPage.mealNum', { num: i + 1 })}</span>
                        <span className="text-ink-500 tabular-nums">{t('weekPage.kcalApprox', { kcal: Math.round(sumMealNutrition(suggested[mk]).kcal) })}</span>
                      </div>
                      <ul className="space-y-0.5">
                        {suggested[mk].map((item, j) => {
                          const f = FOODS[item.food_id];
                          return (
                            <li key={j} className="text-sm text-ink-700 flex gap-2">
                              <span aria-hidden="true">{f?.emoji}</span>
                              <span className="tabular-nums text-ink-500 w-14 shrink-0">{item.amount}{f?.unit === 'g' ? 'g' : f?.unit === 'piece' ? '×' : ' pot'}</span>
                              <span>{f?.name ?? item.food_id}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-ink-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{t('weekPage.waterGoal', { liters: WATER_GOALS[dayType] })}</span>
                  <span>{t('weekPage.targetKcal', { kcal: dayTargets[dayType]?.calories })}</span>
                  {dayType === 'med' && <span>{t('weekPage.medWorkoutBonus')}</span>}
                </p>
              </Panel>
            );
          })}
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="space-y-5">
          <div className="bg-door-50 border border-door-200 rounded-xl p-4 text-sm text-door-900 flex gap-3">
            <Info size={20} className="shrink-0" aria-hidden="true" />
            <div>
              <div className="font-semibold mb-0.5">{t('weekPage.workoutRuleHeader')}</div>
              {t('weekPage.workoutRuleText', {
                count: workoutGoal,
                plural: workoutGoal === 1 ? t('weekPage.workoutRule.daySingular') : t('weekPage.workoutRule.dayPlural'),
                wPlural: workoutGoal === 1 ? t('weekPage.workoutRule.workoutSingular') : t('weekPage.workoutRule.workoutPlural'),
              })}
            </div>
          </div>

          <Panel bodyClassName="">
            <ol className="divide-y divide-ink-200">
              {weekDays.map((sd) => {
                const log = days[sd.day_index];
                const isWorkoutDay = sd.day_type === 'med';
                const done = log?.workout_done;
                const isFuture = sd.day_index > todayIndex;
                const Icon = !isWorkoutDay ? Moon : done ? Check : isFuture ? Clock : Barbell;
                return (
                  <li key={sd.day_index} className={`flex items-center gap-4 px-5 py-3.5 ${sd.day_index === todayIndex ? 'bg-door-50' : ''}`}>
                    <Icon size={20} weight={done ? 'bold' : 'regular'} className={done ? 'text-olive-600' : isWorkoutDay ? 'text-door-600' : 'text-ink-400'} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-900">{fmt(sd.date, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                      <div className="text-xs text-ink-500">{t('modal.dayNum', { num: sd.day_index + 1 })} · {t(`dayType.${sd.day_type}`)}</div>
                    </div>
                    <div className="text-sm text-end">
                      {!isWorkoutDay ? (
                        <span className="text-ink-500">{sd.day_type === 'high' ? t('weekPage.restRecovery') : t('weekPage.restDeficit')}</span>
                      ) : done ? (
                        <span className="text-olive-700 font-semibold">{t('weekPage.workoutDoneBonus')}</span>
                      ) : isFuture ? (
                        <span className="text-ink-500">{t('weekPage.upcoming')}</span>
                      ) : (
                        <TextButton onClick={() => onDayClick(sd.day_index)}>{t('weekPage.logWorkout')}</TextButton>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title={t('weekPage.tipsForPhase', { phase })}>
            <ul className="space-y-2.5 -mt-1">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-700">
                  <span aria-hidden="true" className="mt-2.5 w-3 h-px bg-ink-400 shrink-0" />
                  {t(`weekPage.phase.${phase}.tip.${i}`)}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-5">
          <Ledger items={[
            { label: t('weekPage.stats.daysLogged'), value: completed, suffix: '/ 7' },
            { label: t('weekPage.stats.perfectDays'), value: perfect },
            { label: t('weekPage.stats.workoutsDone'), value: workouts, suffix: `/ ${workoutGoal}` },
            { label: t('weekPage.stats.totalWater'), value: totalWater > 0 ? totalWater.toFixed(1) : '—', suffix: totalWater > 0 ? 'L' : '' },
          ]} />

          <Panel title={t('weekPage.stats.dailyBreakdown')} bodyClassName="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-xs text-ink-500 border-b border-ink-200">
                    <th className="px-5 py-2.5 text-start font-medium">{t('weekPage.col.day')}</th>
                    <th className="px-3 py-2.5 text-start font-medium">{t('weekPage.col.type')}</th>
                    <th className="px-3 py-2.5 text-end font-medium">{t('weekPage.col.calories')}</th>
                    <th className="px-3 py-2.5 text-end font-medium">{t('weekPage.col.water')}</th>
                    <th className="px-3 py-2.5 text-end font-medium">{t('weekPage.col.score')}</th>
                    <th className="px-3 py-2.5 text-center font-medium">{t('weekPage.col.workout')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('weekPage.col.mood')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {weekDays.map((sd) => {
                    const log = days[sd.day_index];
                    return (
                      <tr key={sd.day_index} onClick={() => onDayClick(sd.day_index)}
                        className={`cursor-pointer hover:bg-ink-50 ${sd.day_index === todayIndex ? 'bg-door-50' : ''}`}>
                        <td className="px-5 py-3 font-semibold text-ink-900 whitespace-nowrap">{fmt(sd.date, { weekday: 'short', day: 'numeric' })}</td>
                        <td className="px-3 py-3"><DayTypeChip type={sd.day_type} short /></td>
                        <td className="px-3 py-3 text-end text-ink-700">{log ? `${formatNumber(log.calories_consumed)} / ${formatNumber(log.calories_target)}` : '—'}</td>
                        <td className="px-3 py-3 text-end text-ink-700">{log ? `${log.water_liters} L` : '—'}</td>
                        <td className="px-3 py-3 text-end font-semibold text-ink-900">{log ? `${log.score}/5` : '—'}</td>
                        <td className="px-3 py-3 text-center">
                          {sd.day_type === 'med'
                            ? (log?.workout_done ? <Check size={16} weight="bold" className="inline text-olive-600" aria-label={t('day.workoutDone')} /> : <span className="inline-block w-3.5 h-3.5 border border-ink-300 rounded-sm align-middle" aria-label={t('day.workoutPlanned')} />)
                            : <span className="text-ink-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-ink-700 whitespace-nowrap">{log?.mood ? `${MOOD_EMOJI[log.mood]} ${t(`modal.mood.${log.mood}`)}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
