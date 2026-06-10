<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Search, Check } from 'lucide-vue-next';

interface Option {
  label?: string;
  value?: string | number;
  [key: string]: unknown;
}

interface Props {
  modelValue?: string | number | null;
  options?: Option[] | string[] | number[];
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  optionLabel?: string;
  optionValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false,
  required: false,
  searchable: false,
  optionLabel: 'label',
  optionValue: 'value',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
  change: [value: string | number | null];
}>();

const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`);
const isOpen = ref(false);
const searchQuery = ref('');

const getOptionLabel = (option: Option | string | number): string => {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option);
  }
  return String(option[props.optionLabel] || option.label || option);
};

const getOptionValue = (option: Option | string | number): string | number => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option;
  }
  const value = option[props.optionValue] ?? option.value;
  return (value as string | number) ?? String(option);
};

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return '';
  }
  if (!Array.isArray(props.options)) {
    return '';
  }
  const selected = props.options.find(
    (option) => getOptionValue(option) === props.modelValue,
  );
  return selected ? getOptionLabel(selected) : '';
});

const filteredOptions = computed(() => {
  if (!Array.isArray(props.options)) {
    return [];
  }
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }
  return props.options.filter((option) =>
    getOptionLabel(option)
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase()),
  );
});

const isSelected = (option: Option | string | number): boolean => {
  return getOptionValue(option) === props.modelValue;
};

const toggleDropdown = (): void => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
    if (!isOpen.value) {
      searchQuery.value = '';
    }
  }
};

const selectOption = (option: Option | string | number): void => {
  const value = getOptionValue(option);
  emit('update:modelValue', value);
  emit('change', value);
  isOpen.value = false;
  searchQuery.value = '';
};

const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  const selectElement = document.getElementById(selectId.value);
  if (selectElement && !selectElement.closest('.w-full')?.contains(target)) {
    isOpen.value = false;
    searchQuery.value = '';
  }
};

const baseClasses =
  'relative w-full cursor-pointer rounded-lg border bg-white dark:bg-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

const stateClasses = computed(() => {
  if (props.error) {
    return 'border-red-300 dark:border-red-600';
  }
  return 'border-gray-300 dark:border-gray-600';
});

const selectClasses = computed(() => {
  return [
    baseClasses,
    stateClasses.value,
    'px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white',
  ].join(' ');
});

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onMounted(() => {
  if (isOpen.value) {
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <button
        :id="selectId"
        type="button"
        :disabled="disabled"
        :class="selectClasses"
        @click="toggleDropdown"
      >
        <span class="block truncate text-left">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown
            class="h-5 w-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
          />
        </span>
      </button>

      <!-- Dropdown -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none"
        >
          <!-- Search in dropdown -->
          <div
            v-if="searchable"
            class="p-2 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                @click.stop
              />
            </div>
          </div>

          <!-- Options -->
          <div class="py-1">
            <div
              v-for="option in filteredOptions"
              :key="getOptionValue(option)"
              class="px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400':
                  isSelected(option),
              }"
              @click="selectOption(option)"
            >
              <div class="flex items-center justify-between">
                <span
                  class="block truncate text-sm text-gray-900 dark:text-white"
                >
                  {{ getOptionLabel(option) }}
                </span>
                <Check
                  v-if="isSelected(option)"
                  class="h-5 w-5 text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            <div
              v-if="filteredOptions?.length === 0"
              class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center"
            >
              No options found
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>
