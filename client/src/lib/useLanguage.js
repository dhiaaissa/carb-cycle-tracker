import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api';
import { SUPPORTED_LANGUAGES } from '../i18n';

export function useLanguage(persist = true) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').split('-')[0];

  const changeLanguage = useCallback(async (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    await i18n.changeLanguage(lang);
    try { localStorage.setItem('carb_cycle_lang', lang); } catch {}
    if (!persist) return;
    try {
      const cfg = await api.getConfig();
      const settings = { ...(cfg.settings || {}), language: lang };
      await api.updateConfig({ settings });
    } catch (err) {
      console.warn('Failed to persist language to server:', err);
    }
  }, [i18n, persist]);

  return { language: currentLang, changeLanguage };
}
