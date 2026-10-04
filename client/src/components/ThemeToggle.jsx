import { useTranslation } from 'react-i18next';
import { Desktop, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../lib/theme';

const ICON = { system: Desktop, light: Sun, dark: Moon };

/** One button that cycles system → light → dark. */
export default function ThemeToggle({ variant = 'default' }) {
  const { t } = useTranslation();
  const { pref, cycle } = useTheme();
  const label = t('theme.current', { mode: t(`theme.${pref}`) });
  const Icon = ICON[pref];

  const cls = variant === 'onDark'
    ? 'text-white/90 bg-white/10 hover:bg-white/20'
    : 'text-ink-600 hover:bg-ink-100';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-lg ${cls}`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
