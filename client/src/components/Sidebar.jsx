import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/format';

const PHASE_CONFIG = {
  1: { color: 'from-blue-500 to-blue-600',   ring: 'ring-blue-400',   dot: 'bg-blue-500',   icon: '🚀' },
  2: { color: 'from-red-500 to-red-600',     ring: 'ring-red-400',    dot: 'bg-red-500',    icon: '📉' },
  3: { color: 'from-orange-500 to-orange-600', ring: 'ring-orange-400', dot: 'bg-orange-500', icon: '🔥' },
  4: { color: 'from-purple-500 to-purple-600', ring: 'ring-purple-400', dot: 'bg-purple-500', icon: '💪' },
};

export default function Sidebar({ schedule, days, stats, todayIndex, selectedWeek, onSelectWeek, sidebarOpen, onToggle }) {
  const { t } = useTranslation();
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);

  const todayWeek = todayIndex >= 0 && todayIndex <= 55
    ? Math.floor(todayIndex / 7) + 1
    : null;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 start-0 h-full z-30 bg-gray-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen
      `}>
        {/* Logo */}
        <div className="p-5 pt-safe border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <span className="font-bold text-lg">{t('sidebar.appName')}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t('sidebar.tagline')}</p>
          </div>
          <button
            onClick={onToggle}
            aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Overview + Insights links */}
        <div className="p-3 border-b border-gray-700 space-y-1">
          <button
            onClick={() => { onSelectWeek(null); if (sidebarOpen) onToggle(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedWeek === null
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">📊</span>
            <span>{t('sidebar.overviewStats')}</span>
          </button>
          <button
            onClick={() => { onSelectWeek('insights'); if (sidebarOpen) onToggle(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedWeek === 'insights'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">💡</span>
            <span>{t('nav.insights')}</span>
          </button>
          <button
            onClick={() => { onSelectWeek('grocery'); if (sidebarOpen) onToggle(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedWeek === 'grocery'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">🛒</span>
            <span>{t('nav.grocery')}</span>
          </button>
          <button
            onClick={() => { onSelectWeek('profile'); if (sidebarOpen) onToggle(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedWeek === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">👤</span>
            <span>{t('nav.profile')}</span>
          </button>
          <button
            onClick={() => { onSelectWeek('settings'); if (sidebarOpen) onToggle(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedWeek === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>{t('nav.settings')}</span>
          </button>
        </div>

        {/* Week list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-widest px-3 py-1 font-bold">{t('sidebar.weeks')}</div>
          {weeks.map(w => {
            const weekStart = (w - 1) * 7;
            const weekEnd = w * 7 - 1;
            const weekDays = schedule.slice(weekStart, Math.min(weekEnd + 1, 56));
            if (weekDays.length === 0) return null;

            const phase = weekDays[0]?.phase ?? 1;
            const cfg = PHASE_CONFIG[phase];
            const weekStats = stats?.weekly_summary?.find(ws => ws.week_number === w);
            const completed = weekStats?.completed_days ?? 0;
            const isToday = w === todayWeek;
            const isSelected = selectedWeek === w;

            const startDate = weekDays[0]?.date;
            const fmtShort = (d) => d ? formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' }) : '';

            return (
              <button
                key={w}
                onClick={() => { onSelectWeek(w); if (sidebarOpen) onToggle(); }}
                className={`w-full text-start px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isSelected
                    ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg`
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSelected ? 'bg-white/20' : 'bg-gray-700 group-hover:bg-gray-600'
                  }`}>
                    {w}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{t('nav.weekNum', { num: w })}</span>
                      {isToday && (
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">
                          {t('nav.now')}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {cfg.icon} {t(`phase.${phase}`)} · {fmtShort(startDate)}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                      {t('sidebar.weekProgress', { done: completed })}
                    </div>
                    {weekStats?.cheat_used && <span className="text-xs">🍕</span>}
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className={`mt-2 h-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-700'}`}>
                  <div
                    className={`h-1 rounded-full transition-all ${isSelected ? 'bg-white/70' : cfg.dot}`}
                    style={{ width: `${Math.round((completed / 7) * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom: today info */}
        {todayIndex >= 0 && todayIndex <= 55 && (
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-400 mb-1">{t('sidebar.today')}</div>
            <div className="text-sm font-bold">{t('header.dayOfTotal', { day: todayIndex + 1, total: 56 })}</div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-indigo-400 rounded-full h-1.5 transition-all"
                style={{ width: `${Math.round(((todayIndex + 1) / 56) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {t('sidebar.percentComplete', { value: Math.round(((todayIndex + 1) / 56) * 100) })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
