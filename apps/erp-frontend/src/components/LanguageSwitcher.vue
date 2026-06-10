<template>
  <div class="relative inline-block text-left">
    <button
      @click="open = !open"
      class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <span class="mr-1">{{ currentLabel }}</span>
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    <div
      v-if="open"
      class="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        @click="select(opt.value)"
        :class="[
          'block w-full text-left px-4 py-2 text-sm hover:bg-gray-100',
          locale === opt.value
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700',
        ]"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLocale } from '../composables/useLocale';
import type { Locale } from '../i18n';

const open = ref(false);
const { locale, setLocale } = useLocale();

const options = [
  { value: 'en' as Locale, label: 'English' },
  { value: 'km' as Locale, label: 'ខ្មែរ' },
];

const currentLabel = computed(() => {
  return options.find((o) => o.value === locale.value)?.label ?? 'English';
});

function select(value: Locale) {
  setLocale(value);
  open.value = false;
}
</script>
