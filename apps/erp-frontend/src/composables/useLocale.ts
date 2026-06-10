import { useI18n } from 'vue-i18n';
import type { Locale } from '../i18n';

export function useLocale() {
  const { locale } = useI18n();

  function setLocale(lang: Locale) {
    locale.value = lang;
    localStorage.setItem('locale', lang);
  }

  function toggleLocale() {
    const next: Locale = locale.value === 'en' ? 'km' : 'en';
    setLocale(next);
  }

  return {
    locale,
    setLocale,
    toggleLocale,
  };
}
