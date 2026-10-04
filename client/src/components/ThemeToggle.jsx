import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/theme';

const ICON = { system: '🖥️', light: '☀️', dark: '🌙' };

/** One button that cycles system → light → dark. */
export default function ThemeToggle({ variant = 'default' }) {
  const { t } = useTranslation();
  const { pref, cycle } = useTheme();
  const label = t('theme.current', { mode: t(`theme.${pref}`) });

  const cls = variant === 'onDark'
    ? 'text-white/90 bg-white/10 hover:bg-white/20'
    : 'text-gray-600 hover:bg-gray-100';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-xl text-base ${cls}`}
    >
      <span aria-hidden="true">{ICON[pref]}</span>
    </button>
  );
}
