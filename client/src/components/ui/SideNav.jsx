import { X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

/**
 * The app's mark: a ring in three arcs — the three day types (low / med / high)
 * in the brand's food colours. Used instead of an emoji logo.
 */
export function BrandMark({ size = 28 }) {
  const r = 10, c = 2 * Math.PI * r, gap = 2.2;
  const arc = (frac) => `${c * frac - gap} ${c}`;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <g transform="rotate(-90 14 14)" fill="none" strokeWidth="4.5" strokeLinecap="butt">
        <circle cx="14" cy="14" r={r} stroke="rgb(var(--c-door-600))" strokeDasharray={arc(0.5)} />
        <circle cx="14" cy="14" r={r} stroke="rgb(var(--c-saffron-500))" strokeDasharray={arc(0.3)} strokeDashoffset={-c * 0.5} />
        <circle cx="14" cy="14" r={r} stroke="rgb(var(--c-olive-500))" strokeDasharray={arc(0.2)} strokeDashoffset={-c * 0.8} />
      </g>
    </svg>
  );
}

/** Off-canvas on phones, static column on desktop. */
export function SidebarShell({ open, onClose, header, children, footer }) {
  const { t } = useTranslation();
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed top-0 start-0 h-full z-30 w-72 flex flex-col bg-page border-e border-ink-200
          transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}
          lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen`}
      >
        <div className="px-5 pt-safe h-16 flex items-center justify-between gap-3 border-b border-ink-200 shrink-0">
          {header}
          <button type="button" onClick={onClose} aria-label={t('nav.closeMenu')}
            className="lg:hidden w-10 h-10 -me-2 flex items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100">
            <X size={20} />
          </button>
        </div>
        <div data-scroll className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-ink-200 px-5 py-4 pb-safe shrink-0">{footer}</div>}
      </aside>
    </>
  );
}

export function SidebarHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <BrandMark />
      <div className="min-w-0">
        <div className="font-display font-semibold text-[17px] leading-tight text-ink-900 truncate">{title}</div>
        {subtitle && <div className="text-xs text-ink-500 truncate">{subtitle}</div>}
      </div>
    </div>
  );
}

export function NavItem({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-white text-ink-900 font-semibold ring-1 ring-ink-200'
          : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
      }`}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} className={active ? 'text-door-600' : ''} />
      <span>{label}</span>
    </button>
  );
}

export function SectionLabel({ children }) {
  return <div className="px-3 pt-4 pb-1.5 text-xs font-medium text-ink-500">{children}</div>;
}
