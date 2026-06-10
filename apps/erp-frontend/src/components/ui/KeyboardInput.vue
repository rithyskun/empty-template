<script setup lang="ts">
import { ref } from 'vue';
import { Keyboard, X } from 'lucide-vue-next';
import VirtualKeyboard from './VirtualKeyboard.vue';

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
  keyboardType?: 'text' | 'number' | 'currency';
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
  maxLength?: number;
  showKeyboardButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  keyboardType: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  size: 'md',
  showKeyboardButton: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const showKeyboard = ref(false);
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

const toggleKeyboard = (): void => {
  showKeyboard.value = !showKeyboard.value;
};

const handleKeyboardInput = (value: string | number): void => {
  emit('update:modelValue', value);
};

const baseClasses =
  'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text';

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

const stateClasses = props.error
  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
  : 'border-gray-300 dark:border-dark-border-light';

const inputClasses = [
  baseClasses,
  sizeClasses[props.size],
  stateClasses,
  props.showKeyboardButton ? 'pr-10' : '',
].join(' ');
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
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
        :maxlength="maxLength"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div
        v-if="showKeyboardButton || clearable"
        class="absolute inset-y-0 right-0 pr-3 flex items-center gap-1"
      >
        <button
          v-if="clearable && modelValue"
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-secondary"
          @click="handleClear"
        >
          <X class="h-5 w-5" />
        </button>

        <button
          v-if="showKeyboardButton && !disabled"
          type="button"
          :class="[
            'transition-colors',
            showKeyboard
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-secondary',
          ]"
          @click="toggleKeyboard"
        >
          <Keyboard class="h-5 w-5" />
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>

    <p
      v-else-if="hint"
      class="mt-1 text-sm text-gray-500 dark:text-dark-text-tertiary"
    >
      {{ hint }}
    </p>

    <VirtualKeyboard
      :model-value="modelValue || ''"
      :type="keyboardType"
      :show="showKeyboard"
      :max-length="maxLength"
      @update:model-value="handleKeyboardInput"
      @update:show="showKeyboard = $event"
    />
  </div>
</template>
