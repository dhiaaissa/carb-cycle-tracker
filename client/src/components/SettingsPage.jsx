import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { DEFAULT_DAY_TARGETS } from '../lib/calories';
import ProgrammeSetup from './ProgrammeSetup';
import { DownloadSimple } from '@phosphor-icons/react';
import { PageHeader, Panel, DayTypeChip } from './ui/primitives';

const PROGRAMME_META = {
  carb_cycle:  { nameKey: 'programme.carb_cycle' },
  weight_loss: { nameKey: 'programme.weight_loss' },
  muscle_gain: { nameKey: 'programme.muscle_gain' },
  recomp:      { nameKey: 'programme.body_recomp' },
};


export default function SettingsPage({ config, onConfigUpdate }) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [targets, setTargets] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showProgrammeSetup, setShowProgrammeSetup] = useState(false);

  useEffect(() => {
    if (config) {
      setStartDate(config.start_date || '');
      setTargets(config.settings?.calorie_targets || {});
    }
  }, [config]);

  if (showProgrammeSetup) {
    return <ProgrammeSetup
      initialProgramme={config?.programme}
      onSkip={() => setShowProgrammeSetup(false)}
      onDone={() => { setShowProgrammeSetup(false); window.location.reload(); }}
    />;
  }

  function getTarget(dayType, field) {
    return targets?.[dayType]?.[field] ?? getDefault(dayType, field);
  }

  function getDefault(dayType, field) {
    const suggested = config?.day_targets_suggested ?? DEFAULT_DAY_TARGETS;
    return suggested[dayType]?.[field] ?? 0;
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
      setToast(t('settings.savedToast'));
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setToast(t('settings.saveFailedToast'));
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

  const progKey = config?.programme || 'carb_cycle';
  const progMeta = PROGRAMME_META[progKey];

  const typesToEdit = progKey === 'carb_cycle' ? ['low', 'med', 'high'] : ['flat'];
  const FIELDS = [
    ['calories', 'settings.col.calories', 'bg-ink-300'],
    ['protein_g', 'settings.col.protein', 'bg-door-600'],
    ['carbs_g', 'settings.col.carbs', 'bg-saffron-500'],
    ['fat_g', 'settings.col.fat', 'bg-olive-600'],
  ];
  const input = 'w-full h-10 px-2 rounded-lg border border-ink-300 bg-white text-ink-900 text-sm text-end tabular-nums placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200';

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('settings.heading')} subtitle={t('settings.subheading')} />

      <Panel title={t('settings.programme')} className="mb-6"
        action={<button onClick={() => setShowProgrammeSetup(true)} className="h-9 px-3 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-sm font-semibold text-ink-900">{t('settings.change')}</button>}>
        <div className="-mt-2">
          <div className="font-semibold text-ink-900">{t(progMeta.nameKey)}</div>
          <div className="text-sm text-ink-500 mt-0.5 tabular-nums">
            {progKey !== 'carb_cycle' && config?.day_targets?.flat
              ? t('settings.programme.macroSummary', { cal: config.day_targets.flat.calories, p: config.day_targets.flat.protein_g, c: config.day_targets.flat.carbs_g, f: config.day_targets.flat.fat_g })
              : t('settings.programme.56day')}
          </div>
        </div>
      </Panel>

      <Panel title={t('settings.startDate')} className="mb-6">
        <label htmlFor="start-date" className="sr-only">{t('settings.startDate')}</label>
        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="h-11 px-3 rounded-lg border border-ink-300 bg-white text-ink-900 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200 -mt-1" />
        <p className="text-xs text-ink-500 mt-2">{t('settings.startDateHint')}</p>
      </Panel>

      <Panel title={t('settings.dailyTargets')} className="mb-6">
        <p className="text-sm text-ink-500 -mt-1 mb-4">{t('settings.dailyTargetsHint')}</p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-xs text-ink-500">
                <th className="text-start font-medium pb-2 w-28"><span className="sr-only">{t('weekPage.col.type')}</span></th>
                {FIELDS.map(([key, label, fill]) => (
                  <th key={key} className="text-end font-medium pb-2 px-1">
                    <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className={`w-2 h-2 rounded-[2px] ${fill}`} />{t(label)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {typesToEdit.map((type) => (
                <tr key={type} className="border-t border-ink-200">
                  <th scope="row" className="text-start font-semibold text-ink-900 py-2.5 pe-2">
                    {type === 'flat' ? t('settings.everyDay') : <DayTypeChip type={type} />}
                  </th>
                  {FIELDS.map(([key, label]) => (
                    <td key={key} className="py-2.5 px-1">
                      <input type="number" inputMode="numeric" aria-label={`${type === 'flat' ? t('settings.everyDay') : t(`dayType.${type}`)} — ${t(label)}`}
                        value={getTarget(type, key) || ''} onChange={e => setTarget(type, key, e.target.value)}
                        placeholder={String(getDefault(type, key))} className={input} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="h-11 px-5 rounded-lg bg-door-600 hover:bg-door-700 text-white font-semibold disabled:opacity-50">
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
          {toast && <span role="status" className="text-sm text-olive-700">{toast}</span>}
        </div>
      </Panel>

      <Panel title={t('settings.exportBackup')} className="mb-6">
        <p className="text-sm text-ink-500 -mt-1 mb-4">{t('settings.exportHint')}</p>
        <div className="flex flex-wrap gap-3">
          {[['json', 'settings.exportJson'], ['csv', 'settings.exportCsv']].map(([fmt, label]) => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={exporting}
              className="h-10 px-4 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-sm font-semibold text-ink-900 flex items-center gap-2 disabled:opacity-40">
              <DownloadSimple size={16} aria-hidden="true" />{t(label)}
            </button>
          ))}
        </div>
      </Panel>

      <section className="px-1 text-sm text-ink-500">
        <h2 className="font-semibold text-ink-700 mb-1">{t('settings.about')}</h2>
        <p>{t('settings.aboutText')}</p>
      </section>
    </div>
  );
}
