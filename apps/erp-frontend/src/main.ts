import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { useTheme } from './composables/useTheme';
import { vCan } from './directives';

// Initialize theme before mount to avoid flash
useTheme();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.directive('can', vCan);

app.mount('#app');
