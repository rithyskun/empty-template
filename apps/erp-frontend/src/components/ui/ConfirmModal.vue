<script setup lang="ts">
import { computed } from 'vue';
import { X, AlertTriangle } from 'lucide-vue-next';
import BaseButton from './BaseButton.vue';

interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
  error: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const close = (): void => {
  isOpen.value = false;
  emit('cancel');
};

const confirm = (): void => {
  emit('confirm');
};

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return {
        icon: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/20',
      };
    case 'warning':
      return {
        icon: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      };
    case 'info':
      return {
        icon: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/20',
      };
    default:
      return {
        icon: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/20',
      };
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex items-start p-6">
              <div
                :class="[
                  'flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0',
                  variantClasses.bg,
                ]"
              >
                <AlertTriangle :class="['w-5 h-5', variantClasses.icon]" />
              </div>

              <div class="ml-4 flex-1">
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                  {{ title }}
                </h3>
                <p
                  v-if="error"
                  class="text-sm text-red-600 dark:text-red-400 mb-2 font-medium"
                >
                  {{ error }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ message }}
                </p>
              </div>

              <button
                type="button"
                class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div
              class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700"
            >
              <BaseButton
                variant="secondary"
                type="button"
                :disabled="loading"
                @click="close"
              >
                {{ cancelText }}
              </BaseButton>
              <BaseButton
                :variant="variant === 'danger' ? 'danger' : 'primary'"
                type="button"
                :loading="loading"
                :disabled="loading"
                @click="confirm"
              >
                {{ confirmText }}
              </BaseButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
