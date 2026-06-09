import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function MacroInsights({ stats, config }) {
  const { t } = useTranslation();
  if (!stats) return <div className="text-gray-500">{t('macroInsights.loading')}</div>;

  const target = config?.calorie_target || 0;
  const protTarget = config?.protein_g_target || 0;

  const weeklyAdherence = useMemo(() => {
    return (stats.weekly_summary || []).map(ws => {
      const pct = ws.completed_days ? Math.round((ws.good_days / ws.completed_days) * 100) : 0;
      const calDiff = target ? ws.avg_calories - target : 0;
      return { ...ws, adherence_pct: pct, cal_diff: calDiff };
    });
  }, [stats, target]);

  const bestWeek = weeklyAdherence
    .filter(w => w.completed_days > 0)
    .sort((a, b) => b.adherence_pct - a.adherence_pct)[0];

  const proteinHit = stats.avg_protein && protTarget
    ? Math.round((stats.avg_protein / protTarget) * 100)
    : 0;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('macroInsights.heading')}</h1>
        <p className="text-gray-500">{t('macroInsights.subtitle')}</p>
      </div>

      {/* Headline metrics */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Headline t={t} title={t('macroInsights.avgCalories')} value={stats.avg_calories || 0} unit={t('macroInsights.kcalPerDay')} trend={stats.avg_calories && target ? (stats.avg_calories - target) : null} better="lower" />
        <Headline t={t} title={t('macroInsights.avgProtein')} value={stats.avg_protein || 0} unit={t('macroInsights.gPerDay')} trend={null} pct={proteinHit} />
        <Headline t={t} title={t('macroInsights.adherence')} value={bestWeek?.adherence_pct ?? 0} unit="%" subtitle={bestWeek ? t('macroInsights.bestWeek', { num: bestWeek.week_number }) : t('macroInsights.noDataYet')} />
      </div>

      {/* Weekly breakdown */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">{t('macroInsights.weeklyBreakdown')}</h2>
        {weeklyAdherence.length === 0 ? (
          <p className="text-sm text-gray-500">{t('macroInsights.logSomeFirst')}</p>
        ) : (
          <div className="space-y-2">
            {weeklyAdherence.map(w => (
              <div key={w.week_number} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800">{t('macroInsights.weekN', { num: w.week_number })}</span>
                  <span className="text-xs font-semibold text-gray-500">{t('macroInsights.daysOf7', { done: w.completed_days })}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">{t('macroInsights.adherenceLabel')}</div>
                    <div className="font-bold text-gray-800">{w.adherence_pct}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('macroInsights.avgKcal')}</div>
                    <div className="font-bold text-gray-800">{w.avg_calories || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('macroInsights.vsTarget')}</div>
                    <div className={`font-bold ${w.cal_diff > 0 ? 'text-red-600' : w.cal_diff < 0 ? 'text-emerald-600' : 'text-gray-800'}`}>
                      {w.cal_diff ? `${w.cal_diff > 0 ? '+' : ''}${w.cal_diff}` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">{t('macroInsights.tips')}</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {stats.avg_calories > target + 200 && (
            <li className="flex gap-2"><span>⚠️</span> {t('macroInsights.tipOver', { kcal: stats.avg_calories - target })}</li>
          )}
          {stats.avg_calories > 0 && stats.avg_calories < target - 200 && (
            <li className="flex gap-2"><span>⚠️</span> {t('macroInsights.tipUnder', { kcal: target - stats.avg_calories })}</li>
          )}
          {stats.avg_protein > 0 && proteinHit < 80 && (
            <li className="flex gap-2"><span>🍗</span> {t('macroInsights.tipProtein', { pct: proteinHit })}</li>
          )}
          {stats.streak >= 7 && (
            <li className="flex gap-2"><span>🔥</span> {t('macroInsights.tipStreak', { streak: stats.streak })}</li>
          )}
          {stats.total_completed < 7 && (
            <li className="flex gap-2"><span>📈</span> {t('macroInsights.tipLogMore')}</li>
          )}
          <li className="flex gap-2"><span>📅</span> {t('macroInsights.tipReassess')}</li>
        </ul>
      </div>
    </div>
  );
}

function Headline({ t, title, value, unit, trend, subtitle, pct, better }) {
  let trendColor = 'text-gray-400';
  let trendStr = '';
  if (trend != null) {
    if (better === 'lower') {
      trendColor = trend > 100 ? 'text-red-600' : trend < -100 ? 'text-emerald-600' : 'text-gray-500';
    }
    trendStr = trend > 0 ? `+${trend}` : `${trend}`;
  }
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-md">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="text-3xl font-extrabold text-gray-800 mt-1">{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
      {trendStr && <div className={`text-xs font-bold mt-2 ${trendColor}`}>{trendStr} {t('macroInsights.vsTargetShort')}</div>}
      {pct != null && <div className="text-xs font-bold mt-2 text-gray-600">{t('macroInsights.ofTarget', { pct })}</div>}
      {subtitle && <div className="text-xs text-gray-500 mt-2">{subtitle}</div>}
    </div>
  );
}
