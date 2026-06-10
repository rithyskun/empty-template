import { ref, computed, watch } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'dark' || (theme === 'system' && prefersDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const theme = ref<Theme>(getStoredTheme());
applyTheme(theme.value);

// Listen for system theme changes when in system mode
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (theme.value === 'system') {
      applyTheme('system');
    }
  });

watch(theme, (newTheme) => {
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
});

export function useTheme() {
  const isDark = computed(() => {
    if (theme.value === 'dark') return true;
    if (theme.value === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  function setTheme(value: Theme) {
    theme.value = value;
  }

  function cycleTheme() {
    const order: Theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme.value) + 1) % order.length];
    setTheme(next);
  }

  return {
    theme,
    isDark,
    setTheme,
    cycleTheme,
  };
}
