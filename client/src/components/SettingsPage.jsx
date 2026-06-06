import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CALORIE_TARGETS, MACRO_TARGETS } from '../lib/calories';
import ProgrammeSetup from './ProgrammeSetup';

const PROGRAMME_LABELS = {
  carb_cycle: { name: 'Carb Cycle', emoji: '🔄' },
  weight_loss: { name: 'Weight Loss', emoji: '📉' },
  muscle_gain: { name: 'Muscle Gain', emoji: '💪' },
  recomp: { name: 'Body Recomposition', emoji: '⚖️' },
};

const DAY_TYPES = [
  { key: 'low', label: 'Low Carb', color: 'bg-rose-500', icon: '🔴' },
  { key: 'med', label: 'Medium Carb', color: 'bg-amber-500', icon: '🟡' },
  { key: 'high', label: 'High Carb', color: 'bg-emerald-500', icon: '🟢' },
];

export default function SettingsPage({ config, onConfigUpdate }) {
  const [startDate, setStartDate] = useState('');
  const [targets, setTargets] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showProgrammeSetup, setShowProgrammeSetup] = useState(false);

  if (showProgrammeSetup) {
    return <ProgrammeSetup
      initialProgramme={config?.programme}
      onSkip={() => setShowProgrammeSetup(false)}
      onDone={() => { setShowProgrammeSetup(false); window.location.reload(); }}
    />;
  }

  useEffect(() => {
    if (config) {
      setStartDate(config.start_date || '');
      setTargets(config.settings?.calorie_targets || {});
    }
  }, [config]);

  // Merged targets: user overrides → defaults
  function getTarget(dayType, field) {
    return targets?.[dayType]?.[field] ?? getDefault(dayType, field);
  }

  function getDefault(dayType, field) {
    if (field === 'calories') return CALORIE_TARGETS[dayType];
    return MACRO_TARGETS[dayType]?.[field] ?? 0;
  }

  function setTarget(dayType, field, value) {
    setTargets(prev => ({
      ...prev,
      [dayType]: { ...(prev[dayType] || {}), [field]: value === '' ? undefined : Number(value) },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await api.updateConfig({
        start_date: startDate,
        settings: { ...config.settings, calorie_targets: targets },
      });
      if (onConfigUpdate) onConfigUpdate(result);
      setToast('Settings saved!');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setToast('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format) {
    setExporting(true);
    try {
      const [daysRes, statsRes] = await Promise.all([api.getDays(), api.getStats()]);
      const data = { config, days: daysRes, stats: statsRes, exported_at: new Date().toISOString() };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `carb-cycle-export-${new Date().toISOString().slice(0, 10)}.json`);
      } else {
        // CSV
        const headers = ['day_index','day_type','phase','date','calories_consumed','calories_target','protein_g','carbs_g','fat_g','water_liters','workout_done','mood','energy_level','weight_kg','score'];
        const rows = daysRes.map(d => headers.map(h => d[h] ?? '').join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `carb-cycle-export-${new Date().toISOString().slice(0, 10)}.csv`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Settings</h1>
        <p className="text-gray-500">Customize your programme targets and preferences</p>
      </div>

      {/* Programme */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎯</span> Programme
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{PROGRAMME_LABELS[config?.programme || 'carb_cycle'].emoji}</span>
            <div>
              <div className="font-bold text-gray-800">{PROGRAMME_LABELS[config?.programme || 'carb_cycle'].name}</div>
              {config?.calorie_target ? (
                <div className="text-xs text-gray-500">{config.calorie_target} kcal · {config.protein_g_target}P / {config.carbs_g_target}C / {config.fat_g_target}F</div>
              ) : (
                <div className="text-xs text-gray-500">56-day structured programme</div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowProgrammeSetup(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md"
          >
            Change
          </button>
        </div>
      </div>

      {/* Start Date */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📅</span> Programme Start Date
        </h2>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-medium focus:border-indigo-400 focus:outline-none w-full sm:w-auto" />
        <p className="text-xs text-gray-400 mt-2">Changing this recalculates which day you're on today</p>
      </div>

      {/* Calorie & Macro Targets */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎯</span> Daily Targets
        </h2>
        <p className="text-xs text-gray-400 mb-4">Leave empty to use defaults. These targets apply to all future day logs.</p>

        <div className="space-y-4">
          {DAY_TYPES.map(dt => (
            <div key={dt.key} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{dt.icon}</span>
                <span className="font-bold text-gray-800">{dt.label} Days</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Calories</label>
                  <input type="number" value={getTarget(dt.key, 'calories') || ''}
                    onChange={e => setTarget(dt.key, 'calories', e.target.value)}
                    placeholder={getDefault(dt.key, 'calories')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-red-400 uppercase mb-1 block">Protein (g)</label>
                  <input type="number" value={getTarget(dt.key, 'protein_g') || ''}
                    onChange={e => setTarget(dt.key, 'protein_g', e.target.value)}
                    placeholder={getDefault(dt.key, 'protein_g')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase mb-1 block">Carbs (g)</label>
                  <input type="number" value={getTarget(dt.key, 'carbs_g') || ''}
                    onChange={e => setTarget(dt.key, 'carbs_g', e.target.value)}
                    placeholder={getDefault(dt.key, 'carbs_g')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">Fat (g)</label>
                  <input type="number" value={getTarget(dt.key, 'fat_g') || ''}
                    onChange={e => setTarget(dt.key, 'fat_g', e.target.value)}
                    placeholder={getDefault(dt.key, 'fat_g')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="mb-6">
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl text-base transition-all disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-[0.98]">
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
        {toast && (
          <div className="mt-2 text-center text-sm font-semibold text-green-600 animate-fadeIn">{toast}</div>
        )}
      </div>

      {/* Export & Backup */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📦</span> Export & Backup
        </h2>
        <p className="text-xs text-gray-400 mb-4">Download your data to keep a backup or share with a nutritionist.</p>
        <div className="flex gap-3">
          <button onClick={() => handleExport('json')} disabled={exporting}
            className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-40 active:scale-[0.98]">
            📄 Export JSON
          </button>
          <button onClick={() => handleExport('csv')} disabled={exporting}
            className="flex-1 py-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-40 active:scale-[0.98]">
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-sm font-bold text-gray-600 mb-2">About</h3>
        <p className="text-xs text-gray-500">
          56-Day Carb Cycling Tracker — Track your meals, macros, workouts, and progress throughout your carb cycling programme.
        </p>
        <p className="text-xs text-gray-400 mt-2">Built with React + Express + SQLite</p>
      </div>
    </div>
  );
}
