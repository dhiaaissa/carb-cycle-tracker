import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/format';

const PROGRAMME_META = {
  weight_loss: { nameKey: 'programme.weight_loss', emoji: '📉', taglineKey: 'macroSidebar.taglineWeightLoss' },
  muscle_gain: { nameKey: 'programme.muscle_gain', emoji: '💪', taglineKey: 'macroSidebar.taglineMuscle' },
  recomp:      { nameKey: 'programme.body_recomp', emoji: '⚖️', taglineKey: 'macroSidebar.taglineRecomp' },
};

export default function MacroSidebar({ stats, programme, currentView, onSelectView, sidebarOpen, onToggle }) {
  const { t } = useTranslation();
  const meta = PROGRAMME_META[programme] || PROGRAMME_META.weight_loss;
  const todayWeek = stats?.current_week;
  const weeks = stats?.weekly_summary || [];

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed top-0 start-0 h-full z-30 bg-gray-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen
      `}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta.emoji}</span>
              <span className="font-bold text-lg">{t(meta.nameKey)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t(meta.taglineKey)}</p>
          </div>
          <button onClick={onToggle} className="lg:hidden text-gray-400 hover:text-white text-xl p-1">×</button>
        </div>

        <div className="p-3 border-b border-gray-700 space-y-1">
          <NavLink active={currentView === 'today'} onClick={() => { onSelectView('today'); if (sidebarOpen) onToggle(); }} icon="🍽️" label={t('macroSidebar.today')} />
          <NavLink active={currentView === 'overview'} onClick={() => { onSelectView('overview'); if (sidebarOpen) onToggle(); }} icon="📊" label={t('sidebar.overviewStats')} />
          <NavLink active={currentView === 'insights'} onClick={() => { onSelectView('insights'); if (sidebarOpen) onToggle(); }} icon="💡" label={t('nav.insights')} />
          <NavLink active={currentView === 'settings'} onClick={() => { onSelectView('settings'); if (sidebarOpen) onToggle(); }} icon="⚙️" label={t('nav.settings')} />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-widest px-3 py-1 font-bold">{t('macroSidebar.weeks')}</div>
          {weeks.map(ws => {
            const w = ws.week_number;
            const isToday = w === todayWeek;
            const isSelected = currentView === `week-${w}`;
            const fmt = (d) => d ? formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' }) : '';
            return (
              <button
                key={w}
                onClick={() => { onSelectView(`week-${w}`); if (sidebarOpen) onToggle(); }}
                className={`w-full text-start px-3 py-3 rounded-xl transition-all group ${isSelected ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-700 group-hover:bg-gray-600'}`}>
                    {w}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{t('nav.weekNum', { num: w })}</span>
                      {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">{t('nav.now')}</span>}
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {fmt(ws.start_date)} – {fmt(ws.end_date)}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
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
            <div className="text-xs text-gray-400 mb-1">{t('macroSidebar.today')}</div>
            <div className="text-sm font-bold">{t('macroSidebar.dayN', { num: stats.today_index + 1 })}</div>
            <div className="text-xs text-gray-400 mt-1">{t('macroSidebar.daysLoggedStreak', { count: stats.total_completed, streak: stats.streak })}</div>
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
