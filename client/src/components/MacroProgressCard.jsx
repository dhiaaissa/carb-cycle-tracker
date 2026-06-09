import { useTranslation } from 'react-i18next';

export default function MacroProgressCard({ consumed, target, label, color }) {
  const { t } = useTranslation();
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const remaining = Math.max(0, target - consumed);

  const colorMap = {
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-100' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`${c.light} rounded-2xl p-4 border ${c.border}`}>
      <div className="flex items-baseline justify-between mb-2">
        <div className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{label}</div>
        <div className="text-xs text-gray-500 font-semibold">{Math.round(consumed)} / {Math.round(target)}g</div>
      </div>
      <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
        <div className={`${c.bg} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-gray-600 font-semibold">{Math.round(pct)}%</span>
        <span className="text-gray-500">{t('macroProgress.gramsLeft', { g: Math.round(remaining) })}</span>
      </div>
    </div>
  );
}
