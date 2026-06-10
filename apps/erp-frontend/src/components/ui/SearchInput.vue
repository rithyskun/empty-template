<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search, X, ArrowRight } from 'lucide-vue-next';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showSearchButton?: boolean;
  results?: unknown[];
  showNoResults?: boolean;
  noResultsText?: string;
  debounce?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  disabled: false,
  clearable: true,
  showSearchButton: false,
  results: () => [],
  showNoResults: true,
  noResultsText: 'No results found',
  debounce: 300,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [value: string];
  select: [result: unknown];
  clear: [];
}>();

const showResults = ref(false);
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit('update:modelValue', value);

  // Debounced search
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    emit('search', value);
  }, props.debounce);
};

const handleSearch = (): void => {
  emit('search', props.modelValue);
  showResults.value = false;
};

const handleClear = (): void => {
  emit('update:modelValue', '');
  emit('clear');
  showResults.value = false;
};

const handleSelectResult = (result: unknown): void => {
  emit('select', result);
  showResults.value = false;
};

// Close results when clicking outside
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showResults.value = false;
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      showResults.value = false;
    }
  },
);

// Add click outside listener
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside);
}
</script>

<template>
  <div class="relative w-full">
    <div class="relative">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <Search class="h-5 w-5 text-gray-400" />
      </div>

      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
        @input="handleInput"
        @keydown.enter="handleSearch"
        @focus="showResults = true"
      />

      <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
        <button
          v-if="modelValue && clearable"
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="handleClear"
        >
          <X class="h-5 w-5" />
        </button>

        <button
          v-if="showSearchButton"
          type="button"
          class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          @click="handleSearch"
        >
          <ArrowRight class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && results.length > 0 && modelValue"
      class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
    >
      <div
        v-for="(result, index) in results"
        :key="index"
        class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        @click="handleSelectResult(result)"
      >
        <slot name="result" :result="result">
          <div class="text-sm text-gray-900 dark:text-white">
            {{ result }}
          </div>
        </slot>
      </div>
    </div>

    <!-- No Results -->
    <div
      v-if="showResults && results.length === 0 && modelValue && showNoResults"
      class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
        {{ noResultsText }}
      </p>
    </div>
  </div>
</template>
