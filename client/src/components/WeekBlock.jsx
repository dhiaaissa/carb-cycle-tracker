import { useTranslation } from 'react-i18next';
import DayCard from './DayCard';
import { formatDate } from '../lib/format';

const PHASE_META = {
  1: { color: 'bg-blue-500', goalKey: 'phaseGoal.1' },
  2: { color: 'bg-red-500', goalKey: 'phaseGoal.2' },
  3: { color: 'bg-orange-500', goalKey: 'phaseGoal.3' },
  4: { color: 'bg-purple-500', goalKey: 'phaseGoal.4' },
};

export default function WeekBlock({ weekNum, schedule, days, todayIndex, weekStats, onDayClick }) {
  const { t } = useTranslation();
  const weekStart = (weekNum - 1) * 7;
  const weekDays = schedule.slice(weekStart, weekStart + 7);
  if (weekDays.length === 0) return null;

  const phase = weekDays[0].phase;
  const meta = PHASE_META[phase];
  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  const fmtDate = (d) => formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' });

  const completed = weekStats?.completed_days ?? 0;
  const workouts = weekStats?.workout_days ?? 0;
  const workoutGoal = weekStats?.workout_goal ?? 0;
  const cheatUsed = weekStats?.cheat_used ?? false;

  return (
    <div className="mb-8">
      {/* Week header */}
      <div className={` ${meta.color} text-white rounded-2xl p-5 mb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl"></span>
            <div>
              <h3 className="font-bold text-lg">{t('nav.weekNum', { num: weekNum })}</h3>
              <p className="text-sm opacity-90">{t('week.phaseGoal', { phase, goal: t(meta.goalKey) })}</p>
            </div>
          </div>
          <div className="text-sm font-semibold opacity-90">
            {fmtDate(startDate)} – {fmtDate(endDate)}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">{t('week.daysCompleted')}</div>
            <div className="text-xl font-bold">{t('week.daysOf7', { done: completed })}</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">{t('week.workouts')}</div>
            <div className="text-xl font-bold">{t('week.workoutsOfGoal', { done: workouts, goal: workoutGoal })}</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">{t('week.perfectDays')}</div>
            <div className="text-xl font-bold">{weekStats?.perfect_days ?? 0}</div>
          </div>
          {cheatUsed && (
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <div className="text-xs opacity-75">{t('week.cheatMeal')}</div>
              <div className="text-xl font-bold">{t('week.cheatUsed')}</div>
            </div>
          )}
        </div>

        {/* Completion bar */}
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.round((completed / 7) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Day cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
    </div>
  );
}
