import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES } from '../i18n';

export function getDirection(lang) {
  return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
}

export function useLanguageDirection() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const dir = getDirection(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return dir;
}
