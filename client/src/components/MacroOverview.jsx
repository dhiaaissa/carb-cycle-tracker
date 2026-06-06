import MacroStatsBar from './MacroStatsBar';
import WeightChart from './WeightChart';

export default function MacroOverview({ stats, config, onSelectView }) {
  if (!stats) return <div className="text-center text-gray-500 py-10">Loading stats…</div>;

  const programmeName = config?.programme === 'weight_loss' ? 'Weight Loss'
    : config?.programme === 'muscle_gain' ? 'Muscle Gain'
    : 'Recomposition';

  const weightChange = stats.weight_change;
  const weightChangeLabel = weightChange == null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange} kg`;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Your Programme</h1>
        <p className="text-gray-500">{programmeName} · tracking since day 1</p>
      </div>

      <MacroStatsBar stats={stats} config={config} />

      {/* Targets card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🎯 Daily Targets</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Calories" value={config?.calorie_target} suffix="kcal" color="indigo" />
          <Stat label="Protein"  value={config?.protein_g_target} suffix="g" color="red" />
          <Stat label="Carbs"    value={config?.carbs_g_target}   suffix="g" color="amber" />
          <Stat label="Fat"      value={config?.fat_g_target}     suffix="g" color="blue" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <Mini label="BMR"  value={`${config?.bmr ?? '—'} kcal`} />
          <Mini label="TDEE" value={`${config?.tdee ?? '—'} kcal`} />
          <Mini label="Adj"  value={config?.calorie_target && config?.tdee ? `${config.calorie_target - Math.round(config.tdee) > 0 ? '+' : ''}${config.calorie_target - Math.round(config.tdee)}` : '—'} />
        </div>
      </div>

      {/* Weight progress */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">⚖️ Weight Progress</h2>
          <div className={`text-sm font-bold ${weightChange != null && weightChange < 0 ? 'text-emerald-600' : weightChange != null && weightChange > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
            {weightChangeLabel}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Mini label="Start" value={stats.start_weight ? `${stats.start_weight} kg` : '—'} />
          <Mini label="Now"   value={stats.latest_weight ? `${stats.latest_weight} kg` : '—'} />
          <Mini label="Goal"  value={stats.goal_weight ? `${stats.goal_weight} kg` : '—'} />
        </div>
        <WeightChart weightEntries={stats.weight_entries} />
      </div>

      {/* Weeks grid */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">📅 Jump to a Week</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats.weekly_summary || []).map(ws => {
            const isToday = ws.week_number === stats.current_week;
            const completed = ws.completed_days;
            return (
              <button
                key={ws.week_number}
                onClick={() => onSelectView(`week-${ws.week_number}`)}
                className={`bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-4 text-left hover:scale-105 transition-all shadow-md hover:shadow-lg ${isToday ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📅</span>
                  {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                </div>
                <div className="font-bold text-lg">Week {ws.week_number}</div>
                <div className="text-xs text-white/70">{ws.avg_calories ? `${ws.avg_calories} avg kcal` : 'No logs yet'}</div>
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5" style={{ width: `${Math.round((completed / 7) * 100)}%` }} />
                </div>
                <div className="text-xs text-white/70 mt-1">{completed}/7 days</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, color }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`rounded-xl border p-3 text-center ${c}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold text-gray-800 mt-1">{value ?? '—'}</div>
      <div className="text-[10px] text-gray-500">{suffix}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold text-gray-800 mt-1">{value}</div>
    </div>
  );
}
