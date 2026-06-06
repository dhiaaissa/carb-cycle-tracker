export default function MacroStatsBar({ stats, config }) {
  if (!stats) return null;

  const items = [
    { icon: '🔥', label: 'Streak', value: `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, color: 'from-orange-500 to-red-500' },
    { icon: '✅', label: 'Logged', value: `${stats.total_completed}`, color: 'from-emerald-500 to-green-600' },
    { icon: '⭐', label: 'Perfect Days', value: `${stats.total_perfect}`, color: 'from-amber-400 to-yellow-500' },
    { icon: '📊', label: 'Avg Calories', value: stats.avg_calories ? `${stats.avg_calories}` : '—', color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(it => (
        <div key={it.label} className="bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-md">
          <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${it.color} items-center justify-center text-lg mb-2`}>
            {it.icon}
          </div>
          <div className="text-2xl font-extrabold text-gray-800">{it.value}</div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
