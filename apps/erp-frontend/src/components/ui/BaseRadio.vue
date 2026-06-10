<script setup lang="ts">
import { computed } from 'vue';

interface Option {
  label?: string;
  value?: string | number;
  description?: string;
  [key: string]: unknown;
}

interface Props {
  modelValue?: string | number | null;
  options?: Option[] | string[] | number[];
  label?: string;
  name?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  layout?: 'vertical' | 'horizontal';
  optionLabel?: string;
  optionValue?: string;
  optionDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  layout: 'vertical',
  optionLabel: 'label',
  optionValue: 'value',
  optionDescription: 'description',
  name: `radio-${Math.random().toString(36).substr(2, 9)}`,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
}>();

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

const getOptionDescription = (option: Option | string | number): string => {
  if (typeof option === 'string' || typeof option === 'number') {
    return '';
  }
  return String(option[props.optionDescription] || option.description || '');
};

const isChecked = (option: Option | string | number): boolean => {
  return getOptionValue(option) === props.modelValue;
};

const handleChange = (option: Option | string | number): void => {
  const value = getOptionValue(option);
  emit('update:modelValue', value);
  emit('change', value);
};

const containerClasses = computed(() => {
  return props.layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3';
});

const itemClasses = computed(() => {
  return props.layout === 'horizontal'
    ? 'px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
    : 'px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
});
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div :class="containerClasses">
      <label
        v-for="option in options"
        :key="getOptionValue(option)"
        class="relative flex items-start cursor-pointer group"
        :class="itemClasses"
      >
        <div class="flex items-center h-5">
          <input
            :value="getOptionValue(option)"
            :checked="isChecked(option)"
            :disabled="disabled"
            :name="name"
            type="radio"
            class="h-5 w-5 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @change="handleChange(option)"
          />
        </div>
        <div class="ml-3 text-sm">
          <span
            class="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {{ getOptionLabel(option) }}
          </span>
          <p
            v-if="getOptionDescription(option)"
            class="text-gray-500 dark:text-gray-400 mt-0.5"
          >
            {{ getOptionDescription(option) }}
          </p>
        </div>
      </label>
    </div>

    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>
