<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: 'md',
  color: 'blue',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const toggle = (): void => {
  if (!props.disabled) {
    const newValue = !props.modelValue;
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
};

const sizeConfig = computed(() => {
  const sizes = {
    sm: {
      switch: 'h-5 w-9',
      knob: 'h-5 w-5',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'h-6 w-11',
      knob: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'h-7 w-14',
      knob: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };
  return sizes[props.size];
});

const colorConfig = computed(() => {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-600',
  };
  return colors[props.color];
});

const switchClasses = computed(() => {
  const baseClasses = `relative inline-flex flex-shrink-0 ${sizeConfig.value.switch} border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${props.color}-500 disabled:opacity-50 disabled:cursor-not-allowed`;

  const stateClasses = props.modelValue
    ? colorConfig.value
    : 'bg-gray-200 dark:bg-gray-700';

  return `${baseClasses} ${stateClasses}`;
});

const knobClasses = computed(() => {
  const baseClasses = `pointer-events-none inline-block ${sizeConfig.value.knob} rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`;

  const translateClasses = props.modelValue
    ? sizeConfig.value.translate
    : 'translate-x-0';

  return `${baseClasses} ${translateClasses}`;
});
</script>

<template>
  <div class="flex items-center">
    <button
      type="button"
      :disabled="disabled"
      :class="switchClasses"
      role="switch"
      :aria-checked="modelValue"
      @click="toggle"
    >
      <span :class="knobClasses"></span>
    </button>

    <label
      v-if="label"
      class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
      @click="toggle"
    >
      {{ label }}
      <span
        v-if="description"
        class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5"
      >
        {{ description }}
      </span>
    </label>
  </div>
</template>
