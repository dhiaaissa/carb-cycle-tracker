import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import MacroSidebar from './MacroSidebar';
import MacroOverview from './MacroOverview';
import MacroInsights from './MacroInsights';
import MacroWeekPage from './MacroWeekPage';
import MacroDayEditor from './MacroDayEditor';
import SettingsPage from './SettingsPage';
import ProgrammeSetup from './ProgrammeSetup';

export default function MacroDailyView({ config, foods, presets, onSavePreset, onDeletePreset, onCreateCustomFood, onDeleteCustomFood, onLogout, user }) {
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('today');
  const [selectedDay, setSelectedDay] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProgrammeSetup, setShowProgrammeSetup] = useState(false);

  async function loadStats() {
    try { setStats(await api.getMacroStats()); } catch (e) { console.warn('stats failed', e); }
  }

  useEffect(() => { loadStats(); }, []);

  if (showProgrammeSetup) {
    return <ProgrammeSetup
      initialProgramme={config?.programme}
      onSkip={() => setShowProgrammeSetup(false)}
      onDone={() => { setShowProgrammeSetup(false); window.location.reload(); }}
    />;
  }

  const todayIndex = stats?.today_index ?? 0;

  const breadcrumb = (() => {
    if (selectedDay != null) return `Day ${selectedDay + 1}`;
    if (view === 'today') return 'Today';
    if (view === 'overview') return 'Overview';
    if (view === 'insights') return 'Insights';
    if (view === 'settings') return 'Settings';
    if (view?.startsWith('week-')) return `Week ${view.replace('week-', '')}`;
    return '';
  })();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
      <MacroSidebar
        stats={stats}
        programme={config?.programme}
        currentView={selectedDay != null ? 'today' : view}
        onSelectView={(v) => { setView(v); setSelectedDay(null); }}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current mb-1"></span>
            <span className="block w-5 h-0.5 bg-current"></span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {selectedDay != null && (
              <>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                  Back
                </button>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-gray-800 font-bold text-lg truncate">{breadcrumb}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {view !== 'today' && selectedDay == null && (
              <button
                onClick={() => setView('today')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-md"
              >
                Log Today
              </button>
            )}
            <button
              onClick={() => setShowProgrammeSetup(true)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl"
            >
              ⚙️ Programme
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs font-semibold text-gray-500">@{user?.username}</span>
              <button onClick={onLogout} className="text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold">Log out</button>
            </div>
            <button onClick={onLogout} className="sm:hidden text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold">Log out</button>
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
            ) : view === 'settings' ? (
              <SettingsPage config={config} onConfigUpdate={() => window.location.reload()} />
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
