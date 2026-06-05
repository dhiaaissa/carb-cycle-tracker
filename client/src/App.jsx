import { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { useReminders } from './hooks/useReminders';
import { auth } from './lib/api';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import ProgressCard from './components/ProgressCard';
import DayModal from './components/DayModal';
import WeightChart from './components/WeightChart';
import NutritionReference from './components/NutritionReference';
import WeekPage from './components/WeekPage';
import InsightsPage from './components/InsightsPage';
import SettingsPage from './components/SettingsPage';
import GroceryPage from './components/GroceryPage';
import LoginPage from './components/LoginPage';

export default function App() {
  const [user, setUser] = useState(() => auth.getUser());

  if (!user) {
    return <LoginPage onAuth={setUser} />;
  }

  return <AuthedApp user={user} onLogout={() => { auth.clearSession(); setUser(null); }} />;
}

function AuthedApp({ user, onLogout }) {
  const { config, schedule, days, stats, foods, presets, loading, updateDay, savePreset, deletePreset, createCustomFood, deleteCustomFood } = useAppData();
  const { status: reminderStatus, reminderConfig, startReminders, stopReminders, sendNow, sending } = useReminders();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-5xl mb-4">💪</div>
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white font-semibold text-lg">Loading your tracker...</div>
          <div className="text-gray-400 text-sm mt-1">56-day carb cycling programme</div>
        </div>
      </div>
    );
  }

  const todayIndex = config?.today_index ?? -1;
  const todayWeek = todayIndex >= 0 && todayIndex <= 55 ? Math.floor(todayIndex / 7) + 1 : null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Sidebar */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current"></span>
          </button>

          <div className="flex items-center gap-3">
            {selectedWeek ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWeek(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                >
                  Overview
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-bold">{selectedWeek === 'insights' ? 'Insights' : selectedWeek === 'settings' ? 'Settings' : selectedWeek === 'grocery' ? 'Grocery List' : `Week ${selectedWeek}`}</span>
              </div>
            ) : (
              <span className="text-gray-800 font-bold text-lg">Overview</span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!reminderConfig?.running ? (
              <button
                onClick={startReminders}
                className="hidden sm:flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                title="Start WhatsApp reminders"
              >
                📲 Start Reminders
              </button>
            ) : (
              <button
                onClick={stopReminders}
                className="hidden sm:flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                title="Stop WhatsApp reminders"
              >
                🔕 Stop Reminders
              </button>
            )}
            <button
              onClick={() => setSelectedWeek('grocery')}
              className="hidden sm:flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors"
            >
              🛒 Grocery
            </button>
            {todayIndex >= 0 && todayIndex <= 55 && (
              <div className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                Day {todayIndex + 1} of 56
              </div>
            )}
            {todayIndex >= 0 && todayIndex <= 55 && (
              <button
                onClick={() => setSelectedDay(todayIndex)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-bold transition-colors shadow-md"
              >
                Log Today
              </button>
            )}
            {todayWeek && selectedWeek !== todayWeek && (
              <button
                onClick={() => setSelectedWeek(todayWeek)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-sm font-bold transition-colors shadow-md"
              >
                Go to Today
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs font-semibold text-gray-500">@{user.username}</span>
              <button
                onClick={onLogout}
                title="Log out"
                className="text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {selectedWeek === null ? (
              /* Overview page */
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Your Programme</h1>
                  <p className="text-gray-500">Track your 56-day carb cycling journey</p>
                </div>

                <StatsBar config={config} days={days} stats={stats} />
                <ProgressCard days={days} config={config} />
                <WeightChart weightEntries={stats?.weight_entries} />
                <NutritionReference />

                {/* Quick week navigation grid */}
                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📅</span> Jump to a Week
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1,2,3,4,5,6,7,8].map(w => {
                      const weekStart = (w - 1) * 7;
                      const weekDays = schedule.slice(weekStart, weekStart + 7);
                      if (weekDays.length === 0) return null;
                      const phase = weekDays[0]?.phase;
                      const ws = stats?.weekly_summary?.find(s => s.week_number === w);
                      const completed = ws?.completed_days ?? 0;
                      const isToday = w === todayWeek;
                      const colorMap = {
                        1: 'from-blue-500 to-blue-600',
                        2: 'from-red-500 to-red-600',
                        3: 'from-orange-500 to-orange-600',
                        4: 'from-purple-500 to-purple-600',
                      };
                      const iconMap = { 1: '🚀', 2: '📉', 3: '🔥', 4: '💪' };
                      return (
                        <button
                          key={w}
                          onClick={() => setSelectedWeek(w)}
                          className={`bg-gradient-to-br ${colorMap[phase]} text-white rounded-xl p-4 text-left hover:scale-105 transition-all shadow-md hover:shadow-lg ${isToday ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{iconMap[phase]}</span>
                            {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                          </div>
                          <div className="font-bold text-lg">Week {w}</div>
                          <div className="text-xs text-white/70">Phase {phase}</div>
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
            ) : selectedWeek === 'grocery' ? (
              /* Grocery list page */
              <GroceryPage config={config} />
            ) : selectedWeek === 'insights' ? (
              /* Insights page */
              <InsightsPage />
            ) : selectedWeek === 'settings' ? (
              /* Settings page */
              <SettingsPage config={config} onConfigUpdate={(newConfig) => {
                // Trigger a refetch to update all data with new config
                window.location.reload();
              }} />
            ) : (
              /* Week page */
              <WeekPage
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
