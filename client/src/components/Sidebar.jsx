import { useTranslation } from 'react-i18next';
import { SquaresFour, Lightbulb, Basket, User, GearSix } from '@phosphor-icons/react';
import { formatDate } from '../lib/format';
import { SidebarShell, SidebarHeader, NavItem, SectionLabel } from './ui/SideNav';

// Day-type tints for the 7-square week strip (logged = filled, not yet = outlined).
const DAY_SQUARE = {
  low:  'bg-door-500 border-door-500',
  med:  'bg-saffron-400 border-saffron-400',
  high: 'bg-olive-500 border-olive-500',
};

export default function Sidebar({ schedule, days, stats, todayIndex, selectedWeek, onSelectWeek, sidebarOpen, onToggle }) {
  const { t } = useTranslation();
  const todayWeek = todayIndex >= 0 && todayIndex <= 55 ? Math.floor(todayIndex / 7) + 1 : null;
  const go = (view) => { onSelectWeek(view); if (sidebarOpen) onToggle(); };
  const fmtShort = (d) => (d ? formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' }) : '');
  const inProgramme = todayIndex >= 0 && todayIndex <= 55;

  return (
    <SidebarShell
      open={sidebarOpen}
      onClose={onToggle}
      header={<SidebarHeader title={t('sidebar.appName')} subtitle={t('sidebar.tagline')} />}
      footer={inProgramme && (
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink-900">{t('header.dayOfTotal', { day: todayIndex + 1, total: 56 })}</span>
            <span className="text-ink-500 tabular-nums">{Math.round(((todayIndex + 1) / 56) * 100)}%</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-ink-200" role="progressbar"
            aria-valuemin={0} aria-valuemax={56} aria-valuenow={todayIndex + 1}>
            <div className="h-1 rounded-full bg-door-600" style={{ width: `${((todayIndex + 1) / 56) * 100}%` }} />
          </div>
        </div>
      )}
    >
      <nav className="p-3 space-y-0.5" aria-label={t('nav.main')}>
        <NavItem icon={SquaresFour} label={t('sidebar.overviewStats')} active={selectedWeek === null} onClick={() => go(null)} />
        <NavItem icon={Lightbulb} label={t('nav.insights')} active={selectedWeek === 'insights'} onClick={() => go('insights')} />
        <NavItem icon={Basket} label={t('nav.grocery')} active={selectedWeek === 'grocery'} onClick={() => go('grocery')} />
        <NavItem icon={User} label={t('nav.profile')} active={selectedWeek === 'profile'} onClick={() => go('profile')} />
        <NavItem icon={GearSix} label={t('nav.settings')} active={selectedWeek === 'settings'} onClick={() => go('settings')} />
      </nav>

      <nav className="px-3 pb-4" aria-label={t('sidebar.weeks')}>
        <SectionLabel>{t('sidebar.weeks')}</SectionLabel>
        <ol className="space-y-0.5">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => {
            const weekDays = schedule.slice((w - 1) * 7, w * 7);
            if (!weekDays.length) return null;
            const isSelected = selectedWeek === w;
            const isNow = w === todayWeek;
            const logged = weekDays.filter((d) => days[d.day_index]).length;
            return (
              <li key={w}>
                <button
                  type="button"
                  onClick={() => go(w)}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-label={t('sidebar.weekAria', { num: w, done: logged })}
                  className={`w-full text-start px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-white ring-1 ring-ink-200' : 'hover:bg-ink-100'}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm ${isSelected ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'}`}>
                      {t('nav.weekNum', { num: w })}
                    </span>
                    {isNow && <span className="text-[11px] font-semibold text-door-700">· {t('nav.now')}</span>}
                    <span className="ms-auto text-xs text-ink-500 tabular-nums">{fmtShort(weekDays[0]?.date)}</span>
                  </div>
                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    {weekDays.map((d) => (
                      <span
                        key={d.day_index}
                        className={`h-2 flex-1 rounded-[2px] border ${
                          days[d.day_index] ? DAY_SQUARE[d.day_type] : 'border-ink-300 bg-transparent'
                        } ${d.day_index === todayIndex ? 'outline outline-1 outline-offset-1 outline-ink-900' : ''}`}
                      />
                    ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </SidebarShell>
  );
}
