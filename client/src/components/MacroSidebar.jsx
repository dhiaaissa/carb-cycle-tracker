const PROGRAMME_META = {
  weight_loss: { name: 'Weight Loss', emoji: '📉', tagline: 'Cut calories, keep protein high' },
  muscle_gain: { name: 'Muscle Gain', emoji: '💪', tagline: 'Lean bulk' },
  recomp:      { name: 'Body Recomp', emoji: '⚖️', tagline: 'Fat down, muscle up' },
};

export default function MacroSidebar({ stats, programme, currentView, onSelectView, sidebarOpen, onToggle }) {
  const meta = PROGRAMME_META[programme] || PROGRAMME_META.weight_loss;
  const todayWeek = stats?.current_week;
  const weeks = stats?.weekly_summary || [];

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed top-0 left-0 h-full z-30 bg-gray-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen
      `}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta.emoji}</span>
              <span className="font-bold text-lg">{meta.name}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{meta.tagline}</p>
          </div>
          <button onClick={onToggle} className="lg:hidden text-gray-400 hover:text-white text-xl p-1">×</button>
        </div>

        <div className="p-3 border-b border-gray-700 space-y-1">
          <NavLink active={currentView === 'today'} onClick={() => { onSelectView('today'); if (sidebarOpen) onToggle(); }} icon="🍽️" label="Today" />
          <NavLink active={currentView === 'overview'} onClick={() => { onSelectView('overview'); if (sidebarOpen) onToggle(); }} icon="📊" label="Overview & Stats" />
          <NavLink active={currentView === 'insights'} onClick={() => { onSelectView('insights'); if (sidebarOpen) onToggle(); }} icon="💡" label="Insights" />
          <NavLink active={currentView === 'settings'} onClick={() => { onSelectView('settings'); if (sidebarOpen) onToggle(); }} icon="⚙️" label="Settings" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-widest px-3 py-1 font-bold">Weeks</div>
          {weeks.map(ws => {
            const w = ws.week_number;
            const isToday = w === todayWeek;
            const isSelected = currentView === `week-${w}`;
            const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
            return (
              <button
                key={w}
                onClick={() => { onSelectView(`week-${w}`); if (sidebarOpen) onToggle(); }}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all group ${isSelected ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-700 group-hover:bg-gray-600'}`}>
                    {w}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Week {w}</span>
                      {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {fmt(ws.start_date)} – {fmt(ws.end_date)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>{ws.completed_days}/7</div>
                  </div>
                </div>
                <div className={`mt-2 h-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-700'}`}>
                  <div className={`h-1 rounded-full transition-all ${isSelected ? 'bg-white/70' : 'bg-indigo-400'}`} style={{ width: `${Math.round((ws.completed_days / 7) * 100)}%` }} />
                </div>
              </button>
            );
          })}
        </nav>

        {stats?.today_index >= 0 && (
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-400 mb-1">Today</div>
            <div className="text-sm font-bold">Day {stats.today_index + 1}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.total_completed} day{stats.total_completed !== 1 ? 's' : ''} logged · 🔥 streak {stats.streak}</div>
          </div>
        )}
      </aside>
    </>
  );
}

function NavLink({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
