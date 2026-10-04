import { useTranslation } from 'react-i18next';
import { WATER_GOALS } from '../lib/calories';


export default function StatsBar({ config, days, stats }) {
  const { t } = useTranslation();
  if (!config || !stats) return null;

  const todayIdx = config.today_index;
  const todayType = config.today_day_type;
  const todayLog = days[todayIdx];
  const todayScore = todayLog?.score ?? 0;
  const todayWater = todayLog?.water_liters ?? 0;
  const waterGoal = todayType ? WATER_GOALS[todayType] : 0;

  const cards = [
    {
      label: t('stats.streak'),
      value: t('stats.streakDays', { count: stats.streak }),
      colors: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      icon: '🔥',
    },
    {
      label: t('stats.completedDays'),
      value: t('stats.completedOfTotal', { done: stats.total_completed, total: 56 }),
      colors: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      icon: '✅',
    },
    {
      label: t('stats.todayScore'),
      value: t('stats.dayScoreOfMax', { score: todayScore }),
      colors: todayScore >= 3 ?
        { bg: 'bg-gradient-to-br from-green-50 to-green-100', text: 'text-green-700', border: 'border-green-200' } :
        { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      icon: '⭐',
    },
    {
      label: t('stats.water'),
      value: t('stats.waterOfGoal', { actual: todayWater, goal: waterGoal }),
      colors: todayWater >= waterGoal ?
        { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' } :
        { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      icon: '💧',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl border-2 ${c.colors.border} ${c.colors.bg} p-4 transition-all cursor-default`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">{c.icon}</span>
          </div>
          <div className={`text-xs font-semibold ${c.colors.text} opacity-75 mb-1 uppercase tracking-wider`}>{c.label}</div>
          <div className={`text-lg font-bold ${c.colors.text}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
