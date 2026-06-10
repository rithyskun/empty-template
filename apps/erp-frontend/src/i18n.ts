import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import km from './locales/kh.json';

const messages = {
  en,
  km,
};

export type Locale = 'en' | 'km';

const savedLocale = localStorage.getItem('locale');
const initialLocale: Locale =
  savedLocale === 'kh' ? 'km' : (savedLocale as Locale) || 'en';
if (savedLocale === 'kh') {
  localStorage.setItem('locale', 'km');
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages,
});

export default i18n;
