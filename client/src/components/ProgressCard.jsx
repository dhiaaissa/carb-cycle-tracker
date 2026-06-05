const PHASE_INFO = [
  { phase: 1, name: 'Adaptation', color: 'from-blue-400 to-blue-600', icon: '🚀' },
  { phase: 2, name: 'Fat Loss', color: 'from-red-400 to-red-600', icon: '📉' },
  { phase: 3, name: 'Fat Burning', color: 'from-orange-400 to-orange-600', icon: '🔥' },
  { phase: 4, name: 'Recovery & Perf', color: 'from-purple-400 to-purple-600', icon: '💪' },
];

const PHASE_RANGES = [
  { phase: 1, start: 0, end: 13 },
  { phase: 2, start: 14, end: 27 },
  { phase: 3, start: 28, end: 41 },
  { phase: 4, start: 42, end: 55 },
];

export default function ProgressCard({ days, config }) {
  if (!config) return null;

  const totalLogged = Object.values(days).filter(d => d.score >= 3).length;
  const overallPct = Math.round((totalLogged / 56) * 100);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📊</span> Programme Progress
      </h2>

      {/* Overall bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
          <span>Overall Progress</span>
          <span className="text-indigo-600">{totalLogged}/56 days ({overallPct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full h-4 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-phase bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PHASE_RANGES.map(p => {
          const phaseInfo = PHASE_INFO[p.phase - 1];
          const phaseDays = p.end - p.start + 1;
          const phaseCompleted = Object.values(days)
            .filter(d => d.day_index >= p.start && d.day_index <= p.end && d.score >= 3)
            .length;
          const pct = Math.round((phaseCompleted / phaseDays) * 100);

          return (
            <div key={p.phase} className={`bg-gradient-to-br ${phaseInfo.color} rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{phaseInfo.icon}</span>
                <div>
                  <div className="font-bold">Phase {p.phase}</div>
                  <div className="text-xs opacity-80">{phaseInfo.name}</div>
                </div>
              </div>
              <div className="flex justify-between text-xs font-semibold mb-2 opacity-90">
                <span>Progress</span>
                <span>{phaseCompleted}/{phaseDays}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
