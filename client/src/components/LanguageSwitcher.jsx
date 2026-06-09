import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../lib/useLanguage';

const LANGS = [
  { code: 'en', flag: '🇬🇧', labelKey: 'language.en' },
  { code: 'ar', flag: '🇸🇦', labelKey: 'language.ar' },
  { code: 'fr', flag: '🇫🇷', labelKey: 'language.fr' },
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
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors'
    : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={t('language.switch')}
        className={triggerClass}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline uppercase">{current.code}</span>
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { changeLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start hover:bg-gray-50 transition-colors ${l.code === language ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700'}`}
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span>{t(l.labelKey)}</span>
              {l.code === language && <span className="ms-auto text-indigo-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
