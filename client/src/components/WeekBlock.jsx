import DayCard from './DayCard';

const PHASE_CONFIG = {
  1: { color: 'from-blue-500 to-blue-600', goal: 'Adaptation', icon: '🚀' },
  2: { color: 'from-red-500 to-red-600', goal: 'Fat loss increase', icon: '📉' },
  3: { color: 'from-orange-500 to-orange-600', goal: 'Strong fat burning', icon: '🔥' },
  4: { color: 'from-purple-500 to-purple-600', goal: 'Recovery & Performance', icon: '💪' },
};

export default function WeekBlock({ weekNum, schedule, days, todayIndex, weekStats, onDayClick }) {
  const weekStart = (weekNum - 1) * 7;
  const weekDays = schedule.slice(weekStart, weekStart + 7);
  if (weekDays.length === 0) return null;

  const phase = weekDays[0].phase;
  const config = PHASE_CONFIG[phase];
  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const completed = weekStats?.completed_days ?? 0;
  const workouts = weekStats?.workout_days ?? 0;
  const workoutGoal = weekStats?.workout_goal ?? 0;
  const cheatUsed = weekStats?.cheat_used ?? false;

  return (
    <div className="mb-8">
      {/* Week header */}
      <div className={`bg-gradient-to-r ${config.color} text-white rounded-2xl shadow-lg p-5 mb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h3 className="font-bold text-lg">Week {weekNum}</h3>
              <p className="text-sm opacity-90">Phase {phase} • {config.goal}</p>
            </div>
          </div>
          <div className="text-sm font-semibold opacity-90">
            {fmtDate(startDate)} – {fmtDate(endDate)}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">Days Completed</div>
            <div className="text-xl font-bold">{completed}/7</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">Workouts</div>
            <div className="text-xl font-bold">{workouts}/{workoutGoal}</div>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <div className="text-xs opacity-75">Perfect Days</div>
            <div className="text-xl font-bold">{weekStats?.perfect_days ?? 0}</div>
          </div>
          {cheatUsed && (
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <div className="text-xs opacity-75">Cheat Meal</div>
              <div className="text-xl font-bold">🍕 Used</div>
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
