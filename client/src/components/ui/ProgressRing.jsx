/**
 * Circular progress. Colour comes from a text-* class (the ring uses currentColor),
 * so it follows the theme palette automatically. Past 100% the ring stays full
 * and switches to `overClass` — a gentle signal, never an error colour.
 */
export default function ProgressRing({
  value,
  max,
  size = 80,
  stroke = 8,
  colorClass = 'text-indigo-500',
  overClass = 'text-amber-500',
  trackClass = 'text-gray-100',
  label,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0;
  const over = ratio > 1;
  const shown = Math.min(1, Math.max(0, ratio));

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}
      role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className={trackClass} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
          className={`${over ? overClass : colorClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        {children}
      </div>
    </div>
  );
}
