import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useLanguageDirection } from '../lib/i18nDirection';
import { api } from '../lib/api';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import LogoutButton from './LogoutButton';
import MacroSidebar from './MacroSidebar';
import MacroOverview from './MacroOverview';
import MacroInsights from './MacroInsights';
import MacroWeekPage from './MacroWeekPage';
import MacroDayEditor from './MacroDayEditor';
import SettingsPage from './SettingsPage';
import AdminPage from './AdminPage';
import ProgrammeSetup from './ProgrammeSetup';
import ProfilePage from './ProfilePage';

export default function MacroDailyView({ config, foods, presets, onSavePreset, onDeletePreset, onCreateCustomFood, onDeleteCustomFood, onLogout, user }) {
  const { t } = useTranslation();
  useLanguageDirection();
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('today');
  const [selectedDay, setSelectedDay] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProgrammeSetup, setShowProgrammeSetup] = useState(false);

  async function loadStats() {
    try { setStats(await api.getMacroStats()); } catch (e) { console.warn('stats failed', e); }
  }

  useEffect(() => { loadStats(); }, []);

  // Apply server-side language preference
  useEffect(() => {
    const serverLang = config?.settings?.language;
    if (serverLang && serverLang !== i18n.language) {
      i18n.changeLanguage(serverLang);
    }
  }, [config?.settings?.language]);

  if (showProgrammeSetup) {
    return <ProgrammeSetup
      initialProgramme={config?.programme}
      onSkip={() => setShowProgrammeSetup(false)}
      onDone={() => { setShowProgrammeSetup(false); window.location.reload(); }}
    />;
  }

  const todayIndex = stats?.today_index ?? 0;

  const breadcrumb = (() => {
    if (selectedDay != null) return t('modal.dayNum', { num: selectedDay + 1 });
    if (view === 'today') return t('macroView.today');
    if (view === 'overview') return t('nav.overview');
    if (view === 'insights') return t('nav.insights');
    if (view === 'profile') return t('nav.profile');
    if (view === 'settings') return t('nav.settings');
    if (view === 'admin') return t('nav.admin');
    if (view?.startsWith('week-')) return t('macroView.weekN', { num: view.replace('week-', '') });
    return '';
  })();

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      <MacroSidebar
        stats={stats}
        programme={config?.programme}
        currentView={selectedDay != null ? 'today' : view}
        onSelectView={(v) => { setView(v); setSelectedDay(null); }}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-ink-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 shrink-0 shadow-sm z-10">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={t('nav.openMenu')}
            className="lg:hidden p-2 rounded-lg hover:bg-ink-100 text-ink-600"
          >
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current"></span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {selectedDay != null && (
              <>
                <button onClick={() => setSelectedDay(null)} className="text-ink-400 hover:text-ink-600 text-sm font-medium">
                  {t('macroView.back')}
                </button>
                <span className="text-ink-300">/</span>
              </>
            )}
            <span className="text-ink-800 font-bold text-lg truncate">{breadcrumb}</span>
          </div>

          <div className="ms-auto flex items-center gap-2">
            {view !== 'today' && selectedDay == null && (
              <button
                onClick={() => setView('today')}
                className="bg-door-600 hover:bg-door-700 text-white px-4 py-1.5 rounded-xl text-sm font-bold"
              >
                {t('action.logToday')}
              </button>
            )}
            <button
              onClick={() => setShowProgrammeSetup(true)}
              aria-label={t('macroView.programme')}
              className="text-xs font-bold text-door-600 bg-door-50 hover:bg-door-100 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl flex items-center justify-center"
            >
              
              <span className="hidden sm:inline">{t('macroView.programme')}</span>
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 ps-2 border-s border-ink-200">
              <span className="text-xs font-semibold text-ink-500">@{user?.username}</span>
              <LogoutButton onLogout={onLogout} username={user?.username} />
            </div>
            <LogoutButton onLogout={onLogout} username={user?.username} compact />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {selectedDay != null ? (
              <MacroDayEditor
                dayIndex={selectedDay}
                todayIndex={todayIndex}
                config={config}
                foods={foods}
                presets={presets}
                onSavePreset={onSavePreset}
                onDeletePreset={onDeletePreset}
                onCreateCustomFood={onCreateCustomFood}
                onDeleteCustomFood={onDeleteCustomFood}
                onSaved={loadStats}
              />
            ) : view === 'today' ? (
              <MacroDayEditor
                dayIndex={todayIndex}
                todayIndex={todayIndex}
                config={config}
                foods={foods}
                presets={presets}
                onSavePreset={onSavePreset}
                onDeletePreset={onDeletePreset}
                onCreateCustomFood={onCreateCustomFood}
                onDeleteCustomFood={onDeleteCustomFood}
                onSaved={loadStats}
              />
            ) : view === 'overview' ? (
              <MacroOverview stats={stats} config={config} onSelectView={setView} />
            ) : view === 'insights' ? (
              <MacroInsights stats={stats} config={config} />
            ) : view === 'profile' ? (
              <ProfilePage onEditProgramme={() => setShowProgrammeSetup(true)} />
            ) : view === 'settings' ? (
              <SettingsPage config={config} onConfigUpdate={() => window.location.reload()} />
            ) : view === 'admin' ? (
              <AdminPage />
            ) : view?.startsWith('week-') ? (
              <MacroWeekPage
                weekNum={parseInt(view.replace('week-', ''), 10)}
                todayIndex={todayIndex}
                config={config}
                onSelectDay={(idx) => setSelectedDay(idx)}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
