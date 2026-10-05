import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useAppData } from './hooks/useAppData';
import { useReminders } from './hooks/useReminders';
import { useLanguageDirection } from './lib/i18nDirection';
import { auth, api } from './lib/api';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';
import LogoutButton from './components/LogoutButton';
import Sidebar from './components/Sidebar';
import ProgrammeLog from './components/ProgrammeLog';
import WeeklyInsightsCard from './components/WeeklyInsightsCard';
import AdaptiveTdeeCard from './components/AdaptiveTdeeCard';
import { BrandMark } from './components/ui/SideNav';
import { List, BellRinging, BellSimpleSlash, PencilSimpleLine } from '@phosphor-icons/react';
import { formatDate } from './lib/format';
import TodaySummary from './components/TodaySummary';
import { buildFoodDb } from './lib/mealTotals';
import { DAY_TYPE_STYLE } from './lib/dayTypeStyle';
import { DEFAULT_DAY_TARGETS } from './lib/calories';
import DayModal from './components/DayModal';
import WeightChart from './components/WeightChart';
import NutritionReference from './components/NutritionReference';
import WeekPage from './components/WeekPage';
import InsightsPage from './components/InsightsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import GroceryPage from './components/GroceryPage';
import LoginPage from './components/LoginPage';
import ProgrammeSetup from './components/ProgrammeSetup';
import MacroDailyView from './components/MacroDailyView';

export default function App() {
  const [user, setUser] = useState(() => auth.getUser());
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.me().then(({ user: fresh }) => {
      if (fresh && (fresh.role !== user.role || fresh.username !== user.username)) {
        auth.setSession(auth.getToken(), fresh);
        setUser(fresh);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Pre-login: force English regardless of last setting
  useEffect(() => {
    if (!user && i18n.language !== 'en') i18n.changeLanguage('en');
  }, [user]);

  if (!user) {
    return <LoginPage onAuth={(u, isNew) => { setJustRegistered(!!isNew); setUser(u); }} />;
  }

  return <AuthedApp
    user={user}
    justRegistered={justRegistered}
    onSetupDone={() => setJustRegistered(false)}
    onLogout={() => { auth.clearSession(); setUser(null); setJustRegistered(false); }}
  />;
}

function AuthedApp({ user, justRegistered, onSetupDone, onLogout }) {
  const { t } = useTranslation();
  useLanguageDirection();
  const { config, schedule, days, stats, foods, presets, loading, updateDay, savePreset, deletePreset, createCustomFood, deleteCustomFood, refetch } = useAppData();
  const { status: reminderStatus, reminderConfig, startReminders, stopReminders, sendNow, sending } = useReminders();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const foodDb = useMemo(() => buildFoodDb(foods?.foods), [foods]);

  // Apply server-side language preference when config loads
  useEffect(() => {
    const serverLang = config?.settings?.language;
    if (serverLang && serverLang !== i18n.language) {
      i18n.changeLanguage(serverLang);
    }
  }, [config?.settings?.language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-screen-safe bg-page" role="status" aria-live="polite">
        <div className="animate-spin [animation-duration:1.6s]"><BrandMark size={36} /></div>
        <div className="text-sm text-ink-600">{t('app.loading')}</div>
      </div>
    );
  }

  // First-time setup: new users pick their programme before they see the tracker
  if (justRegistered) {
    return <ProgrammeSetup onDone={() => { onSetupDone(); refetch(); }} />;
  }

  // Route to macro-based dashboard for non-carb-cycle programmes
  if (config?.programme && config.programme !== 'carb_cycle') {
    return <MacroDailyView
      config={config}
      foods={foods}
      presets={presets}
      onSavePreset={savePreset}
      onDeletePreset={deletePreset}
      onCreateCustomFood={createCustomFood}
      onDeleteCustomFood={deleteCustomFood}
      user={user}
      onLogout={onLogout}
    />;
  }

  const todayIndex = config?.today_index ?? -1;
  const todayType = config?.today_day_type;

  const inProgramme = todayIndex >= 0 && todayIndex <= 55;
  const pageTitle = selectedWeek === null ? t('nav.overview')
    : selectedWeek === 'insights' ? t('nav.insights')
    : selectedWeek === 'profile' ? t('nav.profile')
    : selectedWeek === 'settings' ? t('nav.settings')
    : selectedWeek === 'admin' ? t('nav.admin')
    : selectedWeek === 'grocery' ? t('nav.grocery')
    : t('nav.weekNum', { num: selectedWeek });

  return (
    <div className="flex h-screen-safe bg-page overflow-hidden">
      <Sidebar
        schedule={schedule}
        days={days}
        stats={stats}
        todayIndex={todayIndex}
        selectedWeek={selectedWeek}
        onSelectWeek={setSelectedWeek}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-page/95 border-b border-ink-200 px-3 sm:px-6 flex items-center gap-2 sm:gap-3 shrink-0 z-10 pt-safe ps-safe pe-safe">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={t('nav.openMenu')}
            className="lg:hidden w-10 h-10 -ms-1 flex items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 shrink-0"
          >
            <List size={22} />
          </button>

          <h1 className="font-display text-lg sm:text-xl font-semibold text-ink-900 truncate">{pageTitle}</h1>

          <div className="ms-auto flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={reminderConfig?.running ? stopReminders : startReminders}
              aria-label={reminderConfig?.running ? t('header.stopReminders') : t('header.startReminders')}
              title={reminderConfig?.running ? t('header.stopRemindersTitle') : t('header.startRemindersTitle')}
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
            >
              {reminderConfig?.running ? <BellRinging size={20} weight="fill" className="text-door-600" /> : <BellSimpleSlash size={20} />}
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 ps-2 ms-1 border-s border-ink-200">
              <span className="text-xs text-ink-500">@{user.username}</span>
              <LogoutButton onLogout={onLogout} username={user.username} />
            </div>
            <LogoutButton onLogout={onLogout} username={user.username} compact />
            {inProgramme && (
              <button
                onClick={() => setSelectedDay(todayIndex)}
                className="ms-1 h-10 px-3 sm:px-4 rounded-lg bg-door-600 hover:bg-door-700 text-white text-sm font-semibold flex items-center gap-2 shrink-0"
              >
                <PencilSimpleLine size={18} weight="bold" />
                <span className="hidden sm:inline">{t('action.logToday')}</span>
                <span className="sr-only sm:hidden">{t('action.logToday')}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-safe ps-safe pe-safe">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            {selectedWeek === null ? (
              <div>
                {inProgramme && (
                  <div className="mb-6">
                    <p className="text-sm text-ink-500">
                      {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mt-0.5">
                      {t('overview.dayLine', { day: todayIndex + 1, phase: t(`phase.${config?.today_phase}`) })}
                    </p>
                  </div>
                )}

                {todayType && (
                  <TodaySummary
                    meals={days[todayIndex]?.meals_json}
                    target={config?.day_targets?.[todayType] ?? DEFAULT_DAY_TARGETS[todayType]}
                    foodDb={foodDb}
                    onOpenMeal={() => setSelectedDay(todayIndex)}
                    badge={
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${DAY_TYPE_STYLE[todayType].chip}`}>
                        {t(`dayType.${todayType}`)}
                      </span>
                    }
                  />
                )}

                <WeeklyInsightsCard />
                <ProgrammeLog
                  schedule={schedule}
                  days={days}
                  stats={stats}
                  todayIndex={todayIndex}
                  onSelectDay={setSelectedDay}
                  onSelectWeek={setSelectedWeek}
                />
                <AdaptiveTdeeCard />
                <WeightChart weightEntries={stats?.weight_entries} />
                <NutritionReference />
              </div>
            ) : selectedWeek === 'grocery' ? (
              /* Grocery list page */
              <GroceryPage config={config} />
            ) : selectedWeek === 'insights' ? (
              /* Insights page */
              <InsightsPage />
            ) : selectedWeek === 'profile' ? (
              /* Profile page */
              <ProfilePage onEditProgramme={() => setSelectedWeek('settings')} />
            ) : selectedWeek === 'admin' ? (
              <AdminPage />
            ) : selectedWeek === 'settings' ? (
              /* Settings page */
              <SettingsPage config={config} onConfigUpdate={(newConfig) => {
                // Trigger a refetch to update all data with new config
                window.location.reload();
              }} />
            ) : (
              /* Week page */
              <WeekPage
                dayTargets={config?.day_targets}
                weekNum={selectedWeek}
                schedule={schedule}
                days={days}
                stats={stats}
                todayIndex={todayIndex}
                onDayClick={setSelectedDay}
                onSelectWeek={setSelectedWeek}
              />
            )}
          </div>
        </main>
      </div>

      {/* Day modal */}
      {selectedDay !== null && schedule[selectedDay] && (
        <DayModal
          dayTargets={config?.day_targets}
          dayIndex={selectedDay}
          scheduleDay={schedule[selectedDay]}
          dayLog={days[selectedDay]}
          days={days}
          todayIndex={todayIndex}
          onSave={updateDay}
          onClose={() => setSelectedDay(null)}
          presets={presets}
          onSavePreset={savePreset}
          onDeletePreset={deletePreset}
          allFoods={foods?.foods}
          onCreateCustomFood={createCustomFood}
          onDeleteCustomFood={deleteCustomFood}
        />
      )}
    </div>
  );
}
