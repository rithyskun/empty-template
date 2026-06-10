<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTheme, type Theme } from '@/composables/useTheme';
import { Sun, Moon, Monitor } from 'lucide-vue-next';

const { theme, setTheme } = useTheme();
const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const options = [
  { value: 'light' as Theme, label: 'Light', icon: Sun },
  { value: 'dark' as Theme, label: 'Dark', icon: Moon },
  { value: 'system' as Theme, label: 'System', icon: Monitor },
];

const currentIcon = computed(() => {
  if (theme.value === 'light') return Sun;
  if (theme.value === 'dark') return Moon;
  return Monitor;
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
      class="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover text-gray-600 dark:text-dark-text-secondary transition-colors"
      title="Theme"
      @click.stop="open = !open"
    >
      <component :is="currentIcon" class="w-5 h-5" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-36 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        :class="[
          'flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors',
          theme === opt.value
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
            : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover',
        ]"
        @click="select(opt.value)"
      >
        <component :is="opt.icon" class="w-4 h-4" />
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
