import { useTranslation } from 'react-i18next';

export default function MacroStatsBar({ stats, config }) {
  const { t } = useTranslation();
  if (!stats) return null;

  const items = [
    { labelKey: 'macroStats.streak', value: t('macroStats.streakDays', { count: stats.streak }), color: 'bg-orange-500' },
    { labelKey: 'macroStats.logged', value: `${stats.total_completed}`, color: 'bg-emerald-500' },
    { labelKey: 'macroStats.perfectDays', value: `${stats.total_perfect}`, color: 'bg-amber-400' },
    { labelKey: 'macroStats.avgCalories', value: stats.avg_calories ? `${stats.avg_calories}` : '—', color: 'bg-indigo-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(it => (
        <div key={it.labelKey} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-xs text-ink-500">{t(it.labelKey)}</div>
          <div className="font-display text-2xl font-semibold text-ink-900 mt-1 tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
