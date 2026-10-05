import { useTranslation } from 'react-i18next';
import { ForkKnife, SquaresFour, Lightbulb, User, GearSix, ShieldCheck } from '@phosphor-icons/react';
import { auth } from '../lib/api';
import { formatDate } from '../lib/format';
import { SidebarShell, SidebarHeader, NavItem, SectionLabel } from './ui/SideNav';

const PROGRAMME_META = {
  weight_loss: { nameKey: 'programme.weight_loss', taglineKey: 'macroSidebar.taglineWeightLoss' },
  muscle_gain: { nameKey: 'programme.muscle_gain', taglineKey: 'macroSidebar.taglineMuscle' },
  recomp:      { nameKey: 'programme.body_recomp', taglineKey: 'macroSidebar.taglineRecomp' },
};

export default function MacroSidebar({ stats, programme, currentView, onSelectView, sidebarOpen, onToggle }) {
  const { t } = useTranslation();
  const meta = PROGRAMME_META[programme] || PROGRAMME_META.weight_loss;
  const weeks = stats?.weekly_summary || [];
  const go = (view) => { onSelectView(view); if (sidebarOpen) onToggle(); };
  const fmt = (d) => (d ? formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' }) : '');

  return (
    <SidebarShell
      open={sidebarOpen}
      onClose={onToggle}
      header={<SidebarHeader title={t(meta.nameKey)} subtitle={t(meta.taglineKey)} />}
      footer={stats?.today_index >= 0 && (
        <div className="text-sm">
          <div className="font-semibold text-ink-900">{t('macroSidebar.dayN', { num: stats.today_index + 1 })}</div>
          <div className="text-ink-500 mt-0.5">{t('macroSidebar.daysLoggedStreak', { count: stats.total_completed, streak: stats.streak })}</div>
        </div>
      )}
    >
      <nav className="p-3 space-y-0.5" aria-label={t('nav.main')}>
        <NavItem icon={ForkKnife} label={t('macroSidebar.today')} active={currentView === 'today'} onClick={() => go('today')} />
        <NavItem icon={SquaresFour} label={t('sidebar.overviewStats')} active={currentView === 'overview'} onClick={() => go('overview')} />
        <NavItem icon={Lightbulb} label={t('nav.insights')} active={currentView === 'insights'} onClick={() => go('insights')} />
        <NavItem icon={User} label={t('nav.profile')} active={currentView === 'profile'} onClick={() => go('profile')} />
        <NavItem icon={GearSix} label={t('nav.settings')} active={currentView === 'settings'} onClick={() => go('settings')} />
        {['moderator', 'superadmin'].includes(auth.getUser()?.role) && (
          <NavItem icon={ShieldCheck} label={t('nav.admin')} active={currentView === 'admin'} onClick={() => go('admin')} />
        )}
      </nav>

      {weeks.length > 0 && (
        <nav className="px-3 pb-4" aria-label={t('macroSidebar.weeks')}>
          <SectionLabel>{t('macroSidebar.weeks')}</SectionLabel>
          <ol className="space-y-0.5">
            {weeks.map((ws) => {
              const w = ws.week_number;
              const isSelected = currentView === `week-${w}`;
              return (
                <li key={w}>
                  <button
                    type="button"
                    onClick={() => go(`week-${w}`)}
                    aria-current={isSelected ? 'page' : undefined}
                    className={`w-full text-start px-3 py-2.5 rounded-lg transition-colors ${isSelected ? 'bg-white ring-1 ring-ink-200' : 'hover:bg-ink-100'}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm ${isSelected ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'}`}>{t('nav.weekNum', { num: w })}</span>
                      {w === stats?.current_week && <span className="text-[11px] font-semibold text-door-700">· {t('nav.now')}</span>}
                      <span className="ms-auto text-xs text-ink-500 tabular-nums">{fmt(ws.start_date)}</span>
                    </div>
                    <div className="mt-2 flex gap-1" aria-hidden="true">
                      {Array.from({ length: 7 }, (_, i) => (
                        <span key={i} className={`h-2 flex-1 rounded-[2px] border ${i < ws.completed_days ? 'bg-door-500 border-door-500' : 'border-ink-300'}`} />
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </SidebarShell>
  );
}
