import { useMemo } from 'react';

export default function MacroInsights({ stats, config }) {
  if (!stats) return <div className="text-gray-500">Loading insights…</div>;

  const target = config?.calorie_target || 0;
  const protTarget = config?.protein_g_target || 0;

  const weeklyAdherence = useMemo(() => {
    return (stats.weekly_summary || []).map(ws => {
      // adherence = (good_days / completed_days) on a week-by-week basis
      const pct = ws.completed_days ? Math.round((ws.good_days / ws.completed_days) * 100) : 0;
      const calDiff = target ? ws.avg_calories - target : 0;
      return { ...ws, adherence_pct: pct, cal_diff: calDiff };
    });
  }, [stats, target]);

  const bestWeek = weeklyAdherence
    .filter(w => w.completed_days > 0)
    .sort((a, b) => b.adherence_pct - a.adherence_pct)[0];

  const proteinHit = stats.avg_protein && protTarget
    ? Math.round((stats.avg_protein / protTarget) * 100)
    : 0;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Insights</h1>
        <p className="text-gray-500">Trends, adherence, and progress analysis</p>
      </div>

      {/* Headline metrics */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Headline title="Avg Calories" value={stats.avg_calories || 0} unit="kcal/day" trend={stats.avg_calories && target ? (stats.avg_calories - target) : null} better="lower" />
        <Headline title="Avg Protein" value={stats.avg_protein || 0} unit="g/day" trend={null} pct={proteinHit} />
        <Headline title="Adherence" value={bestWeek?.adherence_pct ?? 0} unit="%" subtitle={bestWeek ? `Best: Week ${bestWeek.week_number}` : 'No data yet'} />
      </div>

      {/* Weekly breakdown */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">📊 Weekly Breakdown</h2>
        {weeklyAdherence.length === 0 ? (
          <p className="text-sm text-gray-500">Log some days to see weekly insights.</p>
        ) : (
          <div className="space-y-2">
            {weeklyAdherence.map(w => (
              <div key={w.week_number} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800">Week {w.week_number}</span>
                  <span className="text-xs font-semibold text-gray-500">{w.completed_days}/7 days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">Adherence</div>
                    <div className="font-bold text-gray-800">{w.adherence_pct}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg kcal</div>
                    <div className="font-bold text-gray-800">{w.avg_calories || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">vs Target</div>
                    <div className={`font-bold ${w.cal_diff > 0 ? 'text-red-600' : w.cal_diff < 0 ? 'text-emerald-600' : 'text-gray-800'}`}>
                      {w.cal_diff ? `${w.cal_diff > 0 ? '+' : ''}${w.cal_diff}` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">💡 Personalised Tips</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {stats.avg_calories > target + 200 && (
            <li className="flex gap-2"><span>⚠️</span> You're averaging {stats.avg_calories - target} kcal above your target. Consider smaller portions or lower-calorie swaps.</li>
          )}
          {stats.avg_calories > 0 && stats.avg_calories < target - 200 && (
            <li className="flex gap-2"><span>⚠️</span> You're {target - stats.avg_calories} kcal below target on average. Eating too little can stall progress.</li>
          )}
          {stats.avg_protein > 0 && proteinHit < 80 && (
            <li className="flex gap-2"><span>🍗</span> Your protein is at {proteinHit}% of target. Aim higher — protein protects muscle and reduces hunger.</li>
          )}
          {stats.streak >= 7 && (
            <li className="flex gap-2"><span>🔥</span> Great streak! {stats.streak} days in a row hitting your targets.</li>
          )}
          {stats.total_completed < 7 && (
            <li className="flex gap-2"><span>📈</span> Log at least 7 days to start seeing meaningful trends.</li>
          )}
          <li className="flex gap-2"><span>📅</span> Reassess targets every 2–4 weeks based on actual weight change.</li>
        </ul>
      </div>
    </div>
  );
}

function Headline({ title, value, unit, trend, subtitle, pct, better }) {
  let trendColor = 'text-gray-400';
  let trendStr = '';
  if (trend != null) {
    if (better === 'lower') {
      trendColor = trend > 100 ? 'text-red-600' : trend < -100 ? 'text-emerald-600' : 'text-gray-500';
    }
    trendStr = trend > 0 ? `+${trend}` : `${trend}`;
  }
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-md">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="text-3xl font-extrabold text-gray-800 mt-1">{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
      {trendStr && <div className={`text-xs font-bold mt-2 ${trendColor}`}>{trendStr} vs target</div>}
      {pct != null && <div className="text-xs font-bold mt-2 text-gray-600">{pct}% of target</div>}
      {subtitle && <div className="text-xs text-gray-500 mt-2">{subtitle}</div>}
    </div>
  );
}
