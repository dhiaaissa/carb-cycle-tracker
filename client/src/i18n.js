import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import ar from './locales/ar/common.json';
import fr from './locales/fr/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];
export const RTL_LANGUAGES = ['ar'];

let savedLang = 'en';
try {
  const stored = localStorage.getItem('carb_cycle_lang');
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) savedLang = stored;
} catch {}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    ar: { common: ar },
    fr: { common: fr },
  },
  lng: savedLang,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
