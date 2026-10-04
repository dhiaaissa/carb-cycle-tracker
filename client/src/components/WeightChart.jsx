import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trendWeights } from '../../../shared/nutrition.js';
import { formatDate, formatNumber } from '../lib/format';
import { Panel, TextButton } from './ui/primitives';

const H = 220;
const PAD = { top: 12, right: 12, bottom: 26, left: 40 };
const fmtDay = (d, opts = { day: 'numeric', month: 'short' }) => formatDate(d + 'T12:00:00', opts);

/**
 * Daily weigh-ins (neutral dots) with the 7-day trend (brand line) on top.
 * Day-to-day swings are mostly water — the trend is the number that matters,
 * so it gets the colour and the emphasis. Hover/tap shows both values; a table
 * view is one tap away.
 *
 * @param {{ date: string, weight_kg: number }[]} weightEntries
 * @param {boolean} [bare] render without its own panel (when embedded in another panel)
 */
export default function WeightChart({ weightEntries, bare = false }) {
  const { t } = useTranslation();
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);

  const points = useMemo(
    () => trendWeights((weightEntries || []).filter((e) => e.date && e.weight_kg != null).map((e) => ({ date: e.date, weightKg: e.weight_kg }))),
    [weightEntries],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [asTable, points.length]);

  const toggle = points.length >= 2 && (
    <TextButton onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? t('insights.showChart') : t('insights.showTable')}</TextButton>
  );
  const wrap = (children) => (bare
    ? <div>{toggle && <div className="flex justify-end -mt-1 mb-2">{toggle}</div>}{children}</div>
    : <Panel title={t('weight.title')} className="mb-6" action={toggle}>{children}</Panel>);

  if (points.length < 2) return wrap(<p className="text-sm text-ink-500">{t('weight.needTwo')}</p>);

  const first = points[0];
  const last = points[points.length - 1];
  const change = +(last.trendKg - first.trendKg).toFixed(1);

  const summary = (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-3">
      <div>
        <span className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{formatNumber(last.trendKg)} kg</span>
        <span className="text-sm text-ink-500 ms-2">{t('weight.trendNow')}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${change < 0 ? 'text-olive-700' : 'text-ink-700'}`}>
        {change > 0 ? '+' : ''}{change} kg {t('weight.since', { date: fmtDay(first.date) })}
      </span>
    </div>
  );

  if (asTable) {
    return wrap(
      <>
        {summary}
        <table className="w-full text-sm tabular-nums">
          <thead><tr className="text-xs text-ink-500 border-b border-ink-200">
            <th className="py-2 text-start font-medium">{t('weight.date')}</th>
            <th className="py-2 text-end font-medium">{t('weight.scale')}</th>
            <th className="py-2 text-end font-medium">{t('weight.trend')}</th>
          </tr></thead>
          <tbody className="divide-y divide-ink-200">
            {[...points].reverse().map((p) => (
              <tr key={p.date}>
                <td className="py-2 text-ink-900">{fmtDay(p.date)}</td>
                <td className="py-2 text-end text-ink-600">{p.weightKg} kg</td>
                <td className="py-2 text-end font-semibold text-ink-900">{p.trendKg} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>,
    );
  }

  const W = width;
  const all = points.flatMap((p) => [p.weightKg, p.trendKg]);
  // Whole-kilo gridlines: round the domain out to a step that gives ~3–5 lines.
  const step = Math.max(1, Math.ceil((Math.max(...all) - Math.min(...all) + 1) / 4));
  const lo = Math.floor((Math.min(...all) - 0.3) / step) * step;
  const hi = Math.ceil((Math.max(...all) + 0.3) / step) * step;
  const t0 = Date.parse(first.date);
  const span = Math.max(1, Date.parse(last.date) - t0);
  const x = (d) => PAD.left + ((Date.parse(d) - t0) / span) * (W - PAD.left - PAD.right);
  const y = (v) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const yTicks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const xTicks = [first, points[Math.floor(points.length / 2)], last];
  const trendPath = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.trendKg).toFixed(1)}`).join(' ');

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i; });
    setHover(best);
  }
  const hp = hover != null ? points[hover] : null;

  return wrap(
    <>
      {summary}
      <div ref={wrapRef} className="relative" dir="ltr">
        <svg width={W} height={H} role="img" className="block touch-pan-y"
          aria-label={t('weight.aria', { from: first.trendKg, to: last.trendKg, days: points.length })}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="rgb(var(--c-ink-200))" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--c-ink-500))">{v}</text>
            </g>
          ))}
          {xTicks.map((p, i) => (
            <text key={i} x={x(p.date)} y={H - 6} fontSize="11" fill="rgb(var(--c-ink-500))" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>
              {fmtDay(p.date)}
            </text>
          ))}
          {points.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.weightKg)} r="3" fill="rgb(var(--c-ink-400))" />)}
          <path d={trendPath} fill="none" stroke="rgb(var(--c-door-600))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {hp && (
            <g>
              <line x1={x(hp.date)} x2={x(hp.date)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgb(var(--c-ink-400))" strokeDasharray="3 3" />
              <circle cx={x(hp.date)} cy={y(hp.trendKg)} r="5" fill="rgb(var(--c-door-600))" stroke="rgb(var(--c-surface))" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hp && (
          <div className="pointer-events-none absolute top-0 w-36 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs shadow-[0_4px_12px_rgb(0_0_0/0.1)] tabular-nums"
            style={{ left: Math.min(Math.max(x(hp.date) - 72, 0), W - 144) }}>
            <div className="text-ink-500">{fmtDay(hp.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <div className="text-ink-900"><span className="font-semibold">{hp.trendKg} kg</span> · {t('weight.trend')}</div>
            <div className="text-ink-600">{hp.weightKg} kg · {t('weight.scale')}</div>
          </div>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink-600" aria-label={t('log.legend')}>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-4 h-0.5 rounded bg-door-600" />{t('weight.trendLegend')}</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2 h-2 rounded-full bg-ink-400" />{t('weight.scaleLegend')}</li>
      </ul>
    </>,
  );
}
