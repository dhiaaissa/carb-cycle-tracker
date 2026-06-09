import { useTranslation } from 'react-i18next';
import MacroStatsBar from './MacroStatsBar';
import WeightChart from './WeightChart';

const PROGRAMME_NAME_KEY = {
  weight_loss: 'macroOverview.programmeWeightLoss',
  muscle_gain: 'macroOverview.programmeMuscle',
  recomp: 'macroOverview.programmeRecomp',
};

export default function MacroOverview({ stats, config, onSelectView }) {
  const { t } = useTranslation();
  if (!stats) return <div className="text-center text-gray-500 py-10">{t('macroOverview.loading')}</div>;

  const programmeKey = PROGRAMME_NAME_KEY[config?.programme] || 'macroOverview.programmeRecomp';
  const programmeName = t(programmeKey);

  const weightChange = stats.weight_change;
  const weightChangeLabel = weightChange == null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange} kg`;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('overview.heading')}</h1>
        <p className="text-gray-500">{t('macroOverview.subtitle', { programme: programmeName })}</p>
      </div>

      <MacroStatsBar stats={stats} config={config} />

      {/* Targets card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">{t('macroOverview.dailyTargets')}</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label={t('macroOverview.calories')} value={config?.calorie_target} suffix={t('macroOverview.kcal')} color="indigo" />
          <Stat label={t('macroOverview.protein')}  value={config?.protein_g_target} suffix={t('macroOverview.gramsSuffix')} color="red" />
          <Stat label={t('macroOverview.carbs')}    value={config?.carbs_g_target}   suffix={t('macroOverview.gramsSuffix')} color="amber" />
          <Stat label={t('macroOverview.fat')}      value={config?.fat_g_target}     suffix={t('macroOverview.gramsSuffix')} color="blue" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <Mini label={t('macroOverview.bmr')}  value={`${config?.bmr ?? '—'} ${t('macroOverview.kcal')}`} />
          <Mini label={t('macroOverview.tdee')} value={`${config?.tdee ?? '—'} ${t('macroOverview.kcal')}`} />
          <Mini label={t('macroOverview.adj')}  value={config?.calorie_target && config?.tdee ? `${config.calorie_target - Math.round(config.tdee) > 0 ? '+' : ''}${config.calorie_target - Math.round(config.tdee)}` : '—'} />
        </div>
      </div>

      {/* Weight progress */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">{t('macroOverview.weightProgress')}</h2>
          <div className={`text-sm font-bold ${weightChange != null && weightChange < 0 ? 'text-emerald-600' : weightChange != null && weightChange > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
            {weightChangeLabel}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Mini label={t('macroOverview.start')} value={stats.start_weight ? `${stats.start_weight} kg` : '—'} />
          <Mini label={t('macroOverview.now')}   value={stats.latest_weight ? `${stats.latest_weight} kg` : '—'} />
          <Mini label={t('macroOverview.goal')}  value={stats.goal_weight ? `${stats.goal_weight} kg` : '—'} />
        </div>
        <WeightChart weightEntries={stats.weight_entries} />
      </div>

      {/* Weeks grid */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">{t('macroOverview.jumpWeek')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats.weekly_summary || []).map(ws => {
            const isToday = ws.week_number === stats.current_week;
            const completed = ws.completed_days;
            return (
              <button
                key={ws.week_number}
                onClick={() => onSelectView(`week-${ws.week_number}`)}
                className={`bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-4 text-start hover:scale-105 transition-all shadow-md hover:shadow-lg ${isToday ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📅</span>
                  {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">{t('macroOverview.now2')}</span>}
                </div>
                <div className="font-bold text-lg">{t('nav.weekNum', { num: ws.week_number })}</div>
                <div className="text-xs text-white/70">{ws.avg_calories ? t('macroOverview.avgKcal', { kcal: ws.avg_calories }) : t('macroOverview.noLogsYet')}</div>
                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5" style={{ width: `${Math.round((completed / 7) * 100)}%` }} />
                </div>
                <div className="text-xs text-white/70 mt-1">{t('macroOverview.daysOf7', { done: completed })}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, color }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`rounded-xl border p-3 text-center ${c}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold text-gray-800 mt-1">{value ?? '—'}</div>
      <div className="text-[10px] text-gray-500">{suffix}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold text-gray-800 mt-1">{value}</div>
    </div>
  );
}
