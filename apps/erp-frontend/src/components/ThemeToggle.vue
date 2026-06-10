<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTheme, type Theme } from '@/composables/useTheme';

const { theme, setTheme } = useTheme();
const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const options = [
  { value: 'light' as Theme, label: 'Light' },
  { value: 'dark' as Theme, label: 'Dark' },
  { value: 'system' as Theme, label: 'System' },
];

const currentIcon = computed(() => {
  if (theme.value === 'light') return 'sun';
  if (theme.value === 'dark') return 'moon';
  return 'monitor';
});

function select(value: Theme) {
  setTheme(value);
  open.value = false;
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    open.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <button
      class="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
      title="Theme"
      @click.stop="open = !open"
    >
      <svg
        v-if="currentIcon === 'sun'"
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <svg
        v-else-if="currentIcon === 'moon'"
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      <svg
        v-else
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      v-click-outside="() => (open = false)"
      class="absolute right-0 mt-2 w-36 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        :class="[
          'flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors',
          theme === opt.value
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
        ]"
        @click="select(opt.value)"
      >
        <svg
          v-if="opt.value === 'light'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <svg
          v-else-if="opt.value === 'dark'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        <svg
          v-else
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
