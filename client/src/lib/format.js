import i18n from '../i18n';

const LOCALE_MAP = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };

function getLocale() {
  const lang = (i18n.language || 'en').split('-')[0];
  return LOCALE_MAP[lang] || 'en-GB';
}

export function formatDate(d, opts) {
  return new Date(d).toLocaleDateString(getLocale(), opts);
}

// Numbers use Western digits in every language (as is usual in the Maghreb),
// so kcal and gram values read consistently side by side.
export function formatNumber(n, opts) {
  return new Intl.NumberFormat(`${getLocale()}-u-nu-latn`, opts).format(n);
}
