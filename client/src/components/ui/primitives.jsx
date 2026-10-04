/**
 * Shared building blocks for inner pages (see DESIGN.md). Keep pages composed
 * from these so they can't drift apart visually.
 */
import { useTranslation } from 'react-i18next';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { DAY_TYPE_STYLE } from '../../lib/dayTypeStyle';

/** Small context line, condensed title, optional subtitle and actions. */
export function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm text-ink-500">{eyebrow}</p>}
          <h1 className="font-display text-[28px] sm:text-3xl font-semibold text-ink-900 leading-tight mt-0.5">{title}</h1>
          {subtitle && <p className="text-sm text-ink-600 mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Previous / next pager (mirrors in RTL). */
export function Pager({ onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel }) {
  const btn = 'w-10 h-10 flex items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 hover:bg-ink-100 disabled:opacity-40 disabled:pointer-events-none';
  return (
    <>
      <button type="button" onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel} className={btn}>
        <CaretLeft size={18} className="rtl:rotate-180" />
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel} className={btn}>
        <CaretRight size={18} className="rtl:rotate-180" />
      </button>
    </>
  );
}

/** White surface with a hairline border. `title` renders a condensed heading row. */
export function Panel({ title, action, children, className = '', bodyClassName = 'p-5 sm:p-6', as: Tag = 'section' }) {
  return (
    <Tag className={`bg-white border border-ink-200 rounded-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5">
          <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}

/** A row of label/value pairs separated by hairlines — the "ledger" summary. */
export function Ledger({ items, className = '' }) {
  return (
    <dl className={`grid grid-cols-2 sm:flex bg-white border border-ink-200 rounded-xl divide-ink-200 sm:divide-x rtl:sm:divide-x-reverse ${className}`}>
      {items.map((it, i) => (
        <div key={i} className={`sm:flex-1 px-4 sm:px-5 py-3.5 ${i >= 2 ? 'border-t border-ink-200 sm:border-t-0' : ''} ${i % 2 === 1 ? 'border-s border-ink-200 sm:border-s-0' : ''}`}>
          <dt className="text-xs text-ink-500">{it.label}</dt>
          <dd className="font-display text-2xl font-semibold text-ink-900 tabular-nums mt-0.5">
            {it.value}
            {it.suffix && <span className="text-sm font-sans font-normal text-ink-500 ms-1">{it.suffix}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Underline tabs (same pattern as the login form). */
export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 border-b border-ink-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={`pb-3 -mb-px text-sm font-semibold whitespace-nowrap border-b-2 ${
            value === tab.key ? 'border-door-600 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DayTypeChip({ type, short = false }) {
  const { t } = useTranslation();
  if (!type) return null;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${DAY_TYPE_STYLE[type]?.chip ?? ''}`}>
      {t(`dayType.${type}${short ? 'Short' : ''}`)}
    </span>
  );
}

/** Small square swatch in the day type's colour. */
export function DayTypeSwatch({ type, className = 'w-2.5 h-2.5' }) {
  const fill = { low: 'bg-door-500', med: 'bg-saffron-400', high: 'bg-olive-600', flat: 'bg-ink-300' }[type];
  return <span aria-hidden="true" className={`inline-block rounded-[2px] ${fill} ${className}`} />;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="text-center py-14 px-6">
      {Icon && <Icon size={36} className="mx-auto text-ink-400" aria-hidden="true" />}
      <h2 className="font-display text-xl font-semibold text-ink-900 mt-3">{title}</h2>
      {text && <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Text button / link-style action. */
export function TextButton({ children, ...props }) {
  return (
    <button type="button" {...props} className={`text-sm font-semibold text-door-700 hover:text-door-800 hover:underline underline-offset-2 ${props.className ?? ''}`}>
      {children}
    </button>
  );
}
