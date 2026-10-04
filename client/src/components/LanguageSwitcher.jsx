import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Translate, Check } from '@phosphor-icons/react';
import { useLanguage } from '../lib/useLanguage';

const LANGS = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'ar', labelKey: 'language.ar' },
  { code: 'fr', labelKey: 'language.fr' },
];

export default function LanguageSwitcher({ persist = true, variant = 'default' }) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage(persist);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGS.find(l => l.code === language) || LANGS[0];

  const triggerClass = variant === 'onDark'
    ? 'h-10 flex items-center gap-1.5 px-2.5 rounded-lg text-white/90 bg-white/10 hover:bg-white/20'
    : 'h-10 flex items-center gap-1.5 px-2.5 rounded-lg text-ink-600 hover:bg-ink-100 transition-colors';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={t('language.switch')}
        aria-label={t('language.switch')}
        aria-expanded={open}
        className={triggerClass}
      >
        <Translate size={18} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase">{current.code}</span>
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-48 bg-white border border-ink-200 rounded-lg z-50 overflow-hidden shadow-[0_8px_24px_rgb(0_0_0/0.12)]">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { changeLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start hover:bg-gray-50 transition-colors ${l.code === language ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700'}`}
            >
              <span className="w-6 text-xs font-semibold uppercase text-ink-500">{l.code}</span>
              <span>{t(l.labelKey)}</span>
              {l.code === language && <Check size={16} weight="bold" className="ms-auto text-door-600" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
