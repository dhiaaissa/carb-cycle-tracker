import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { FOODS } from '../lib/foods';

export default function InsightsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInsights().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">{t('insights.loading')}</div>;
  if (!data || data.total_days_logged === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <div className="text-lg font-bold text-gray-700">{t('insights.noDataTitle')}</div>
        <p className="text-sm text-gray-400 mt-1">{t('insights.noDataSub')}</p>
      </div>
    );
  }

  const { calorie_adherence, macro_averages, top_foods, best_day, worst_day, weekly_adherence } = data;
  const avgAdherence = calorie_adherence.length > 0
    ? Math.round(calorie_adherence.reduce((s, d) => s + d.pct, 0) / calorie_adherence.length)
    : 0;

  const totalMacros = macro_averages.protein_g + macro_averages.carbs_g + macro_averages.fat_g;
  const proteinPct = totalMacros > 0 ? Math.round((macro_averages.protein_g / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((macro_averages.carbs_g / totalMacros) * 100) : 0;
  const fatPct = 100 - proteinPct - carbsPct;

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('insights.heading')}</h1>
        <p className="text-sm text-gray-400">{t('insights.daysLogged', { count: data.total_days_logged })}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon="🎯" label={t('insights.avgAdherence')} value={`${avgAdherence}%`}
          color={avgAdherence >= 85 ? 'text-green-600' : avgAdherence >= 70 ? 'text-yellow-600' : 'text-red-500'} />
        <SummaryCard icon="🥩" label={t('insights.avgProtein')} value={`${macro_averages.protein_g}g`} color="text-red-500" />
        <SummaryCard icon="🌾" label={t('insights.avgCarbs')} value={`${macro_averages.carbs_g}g`} color="text-amber-500" />
        <SummaryCard icon="🧈" label={t('insights.avgFat')} value={`${macro_averages.fat_g}g`} color="text-blue-500" />
      </div>

      {/* Macro Split */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-3">{t('insights.avgMacroSplit')}</h3>
        <div className="flex rounded-full h-6 overflow-hidden">
          <div className="bg-red-400 transition-all" style={{ width: `${proteinPct}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${carbsPct}%` }} />
          <div className="bg-blue-400 transition-all" style={{ width: `${fatPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold">
          <span className="text-red-500">{t('insights.proteinPct', { pct: proteinPct })}</span>
          <span className="text-amber-500">{t('insights.carbsPct', { pct: carbsPct })}</span>
          <span className="text-blue-500">{t('insights.fatPct', { pct: fatPct })}</span>
        </div>
      </div>

      {/* Weekly Adherence */}
      {weekly_adherence.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{t('insights.weeklyAdherence')}</h3>
          <div className="space-y-2">
            {weekly_adherence.map(w => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-16 shrink-0">{t('insights.weekN', { num: w.week })}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      w.avg_adherence_pct >= 85 ? 'bg-green-400' : w.avg_adherence_pct >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, w.avg_adherence_pct)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 w-10 text-end">{w.avg_adherence_pct}%</span>
                <span className="text-xs text-gray-400 w-16 text-end">{t('insights.scoreLabel', { score: w.avg_score })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Foods */}
      {top_foods.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{t('insights.mostEaten')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {top_foods.map((tf, i) => {
              const food = FOODS[tf.food_id];
              if (!food) return null;
              const maxCount = top_foods[0].count;
              return (
                <div key={tf.food_id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <div className="text-2xl mb-1">{food.emoji}</div>
                  <div className="text-xs font-bold text-gray-700 truncate">{food.name.split('(')[0].trim()}</div>
                  <div className="mt-1.5 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${(tf.count / maxCount) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{t('insights.timesEaten', { count: tf.count })}</div>
                  {i === 0 && <div className="text-[10px] text-indigo-500 font-bold mt-0.5">🏆 #1</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best / Worst Day */}
      <div className="grid grid-cols-2 gap-3">
        {best_day && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
            <div className="text-xs font-bold text-green-600 mb-1">{t('insights.bestDay')}</div>
            <div className="text-lg font-bold text-gray-800">{t('modal.dayNum', { num: best_day.day_index + 1 })}</div>
            <div className="text-xs text-gray-500">{t('insights.dayScoreAndKcal', { score: best_day.score, kcal: best_day.calories })}</div>
          </div>
        )}
        {worst_day && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <div className="text-xs font-bold text-red-500 mb-1">{t('insights.needsWork')}</div>
            <div className="text-lg font-bold text-gray-800">{t('modal.dayNum', { num: worst_day.day_index + 1 })}</div>
            <div className="text-xs text-gray-500">{t('insights.dayScoreAndKcal', { score: worst_day.score, kcal: worst_day.calories })}</div>
          </div>
        )}
      </div>

      {/* Daily Adherence Chart */}
      {calorie_adherence.length > 1 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{t('insights.dailyAdherence')}</h3>
          <div className="flex items-end gap-0.5 h-32">
            {calorie_adherence.map(d => {
              const h = Math.min(100, d.pct);
              const color = d.pct >= 85 && d.pct <= 115 ? 'bg-green-400' : d.pct > 115 ? 'bg-red-400' : 'bg-yellow-400';
              return (
                <div key={d.day_index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className={`w-full rounded-t-sm ${color} transition-all min-h-[2px]`}
                    style={{ height: `${h}%` }} />
                  <div className="absolute -top-6 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {t('day.short', { num: d.day_index + 1 })}: {d.pct}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{t('modal.dayNum', { num: 1 })}</span>
            <span className="border-t border-dashed border-gray-300 flex-1 mx-2 mt-1.5" />
            <span>{t('modal.dayNum', { num: calorie_adherence[calorie_adherence.length - 1].day_index + 1 })}</span>
          </div>
          <div className="flex gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-sm" /> {t('insights.legendOnTarget')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-sm" /> {t('insights.legendUnder')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-sm" /> {t('insights.legendOver')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{label}</div>
    </div>
  );
}
