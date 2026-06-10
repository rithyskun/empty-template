<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  /** Controls the visibility of the drawer */
  modelValue: boolean;
  /** Position of the drawer (left or right side) */
  position?: 'left' | 'right';
  /** Title displayed in the drawer header */
  title?: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** Size of the drawer */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Hide the header section */
  hideHeader?: boolean;
  /** Hide the close button */
  hideClose?: boolean;
  /** Allow closing drawer by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing drawer with Escape key */
  closeOnEscape?: boolean;
  /** Enable scrolling in drawer content */
  scrollable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
  title: undefined,
  subtitle: undefined,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  open: [];
}>();

const close = (): void => {
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = (): void => {
  if (props.closeOnBackdrop) {
    close();
  }
};

const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    close();
  }
};

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };
  return sizes[props.size];
});

const positionClasses = computed(() => {
  return props.position === 'left' ? 'left-0' : 'right-0';
});

const drawerClasses = computed(() => {
  return [
    'fixed top-0 bottom-0 z-50 w-full',
    sizeClasses.value,
    positionClasses.value,
    'bg-white dark:bg-gray-900',
    'shadow-2xl',
    'flex flex-col',
  ].join(' ');
});

const contentClasses = computed(() => {
  return [
    'flex-1 px-6 py-4',
    props.scrollable ? 'overflow-y-auto' : 'overflow-hidden',
  ].join(' ');
});

const enterActiveClass = computed(() => {
  return 'transition-transform duration-300 ease-out';
});

const enterFromClass = computed(() => {
  return props.position === 'left' ? '-translate-x-full' : 'translate-x-full';
});

const enterToClass = 'translate-x-0';

const leaveActiveClass = computed(() => {
  return 'transition-transform duration-300 ease-in';
});

const leaveFromClass = 'translate-x-0';

const leaveToClass = computed(() => {
  return props.position === 'left' ? '-translate-x-full' : 'translate-x-full';
});

// Handle body scroll lock
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = 'hidden';
      emit('open');
    } else {
      document.body.style.overflow = '';
    }
  },
);

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>
<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        @click="handleBackdropClick"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition
      :enter-active-class="enterActiveClass"
      :enter-from-class="enterFromClass"
      :enter-to-class="enterToClass"
      :leave-active-class="leaveActiveClass"
      :leave-from-class="leaveFromClass"
      :leave-to-class="leaveToClass"
    >
      <div
        v-if="modelValue"
        :class="drawerClasses"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          v-if="!hideHeader"
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div class="flex-1">
            <h2
              v-if="title"
              class="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              class="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {{ subtitle }}
            </p>
          </div>
          <button
            v-if="!hideClose"
            type="button"
            class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="close"
          >
            <X class="h-6 w-6" />
          </button>
        </div>

        <!-- Content -->
        <div :class="contentClasses">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
