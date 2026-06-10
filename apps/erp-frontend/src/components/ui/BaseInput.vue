<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';

interface Props {
  modelValue?: string | number;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'time';
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  min?: number | string;
  max?: number | string;
  step?: number | string;
  autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const slots = useSlots();
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`);

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
};

const handleBlur = (event: FocusEvent): void => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent): void => {
  emit('focus', event);
};

const handleClear = (): void => {
  emit('update:modelValue', '');
};

const baseClasses =
  'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white';

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  return sizes[props.size];
});

const stateClasses = computed(() => {
  if (props.error) {
    return 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500';
  }
  return 'border-gray-300 dark:border-gray-600';
});

const paddingClasses = computed(() => {
  let classes = '';
  if (slots['icon-left']) {
    classes += 'pl-10 ';
  }
  if (slots['icon-right'] || props.clearable) {
    classes += 'pr-10';
  }
  return classes;
});

const inputClasses = computed(() => {
  return [
    baseClasses,
    sizeClasses.value,
    stateClasses.value,
    paddingClasses.value,
  ].join(' ');
});
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <div
        v-if="$slots['icon-left']"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <slot name="icon-left"></slot>
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div
        v-if="$slots['icon-right'] || clearable"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        <button
          v-if="clearable && modelValue"
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="handleClear"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <slot v-else name="icon-right"></slot>
      </div>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>
