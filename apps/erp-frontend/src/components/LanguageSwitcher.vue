<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLocale } from '@/composables/useLocale';
import type { Locale } from '@/i18n';

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const { locale, setLocale } = useLocale();

const options = [
  { value: 'en' as Locale, label: 'English' },
  { value: 'km' as Locale, label: 'ខ្មែរ' },
];

const currentLabel = computed(() => {
  return options.find((o) => o.value === locale.value)?.label ?? 'EN';
});

function select(value: Locale) {
  setLocale(value);
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
      :title="currentLabel"
      @click.stop="open = !open"
    >
      <span class="text-xs font-bold">{{ locale.toUpperCase() }}</span>
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
          locale === opt.value
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
            : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover',
        ]"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
