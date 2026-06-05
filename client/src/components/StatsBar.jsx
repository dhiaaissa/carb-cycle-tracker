import { WATER_GOALS } from '../lib/calories';

const TYPE_COLORS = {
  low: { bg: 'bg-gradient-to-br from-red-50 to-red-100', text: 'text-red-700', border: 'border-red-200' },
  med: { bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  high: { bg: 'bg-gradient-to-br from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' },
};

const TYPE_LABELS = { low: 'Low Carb', med: 'Medium Carb', high: 'High Carb' };
const TYPE_EMOJI = { low: '🔴', med: '🟡', high: '🟢' };

export default function StatsBar({ config, days, stats }) {
  if (!config || !stats) return null;

  const todayIdx = config.today_index;
  const todayType = config.today_day_type;
  const todayLog = days[todayIdx];
  const todayScore = todayLog?.score ?? 0;
  const todayWater = todayLog?.water_liters ?? 0;
  const waterGoal = todayType ? WATER_GOALS[todayType] : 0;
  const todayCals = todayLog?.calories_consumed ?? 0;
  const todayTarget = todayLog?.calories_target ?? 0;

  const cards = [
    {
      label: "Today's Type",
      value: todayType ? `${TYPE_EMOJI[todayType]} ${TYPE_LABELS[todayType]}` : 'N/A',
      colors: todayType ? TYPE_COLORS[todayType] : { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      icon: '📅',
    },
    {
      label: 'Streak',
      value: `${stats.streak} days`,
      colors: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      icon: '🔥',
    },
    {
      label: 'Completed Days',
      value: `${stats.total_completed} / 56`,
      colors: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      icon: '✅',
    },
    {
      label: "Today's Score",
      value: `${todayScore} / 5`,
      colors: todayScore >= 3 ?
        { bg: 'bg-gradient-to-br from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' } :
        { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      icon: '⭐',
    },
    {
      label: 'Water',
      value: `${todayWater}L / ${waterGoal}L`,
      colors: todayWater >= waterGoal ?
        { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' } :
        { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      icon: '💧',
    },
    {
      label: 'Calories',
      value: todayTarget ? `${todayCals} / ${todayTarget}` : '—',
      colors: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      icon: '🔥',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl border-2 ${c.colors.border} ${c.colors.bg} p-4 transition-all hover:shadow-md hover:scale-105 cursor-default`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{c.icon}</span>
          </div>
          <div className={`text-xs font-semibold ${c.colors.text} opacity-75 mb-1 uppercase tracking-wider`}>{c.label}</div>
          <div className={`text-lg font-bold ${c.colors.text}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
