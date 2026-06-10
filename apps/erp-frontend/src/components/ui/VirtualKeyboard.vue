<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Keyboard, X, Globe } from 'lucide-vue-next';

interface Props {
  modelValue: string | number;
  type?: 'text' | 'number' | 'currency';
  show?: boolean;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  show: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'update:show': [value: boolean];
  close: [];
}>();

type Language = 'en' | 'km';
const currentLanguage = ref<Language>('en');
const capsLock = ref(false);
const inputValue = ref(String(props.modelValue || ''));

watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = String(newValue || '');
  },
);

const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'en' ? 'km' : 'en';
};

const toggleCapsLock = () => {
  capsLock.value = !capsLock.value;
};

const englishLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const khmerLayout = [
  ['១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩', '០'],
  ['ឆ', 'ឹ', 'េ', 'រ', 'ត', 'យ', 'ុ', 'ិ', 'ោ', 'ផ'],
  ['ា', 'ស', 'ដ', 'ថ', 'ង', 'ហ', '្', 'ក', 'ល'],
  ['ឋ', 'ខ', 'ច', 'វ', 'ប', 'ន', 'ម'],
];

const numberLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0', '.', '00'],
];

const currencyLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0', '.', '00'],
];

const keyboardLayout = computed(() => {
  if (props.type === 'number') return numberLayout;
  if (props.type === 'currency') return currencyLayout;
  return currentLanguage.value === 'en' ? englishLayout : khmerLayout;
});

const handleKeyPress = (key: string) => {
  if (props.maxLength && inputValue.value.length >= props.maxLength) {
    return;
  }

  let processedKey = key;
  if (
    props.type === 'text' &&
    currentLanguage.value === 'en' &&
    capsLock.value
  ) {
    processedKey = key.toUpperCase();
  }

  inputValue.value += processedKey;
  emitValue();
};

const handleBackspace = () => {
  inputValue.value = inputValue.value.slice(0, -1);
  emitValue();
};

const handleSpace = () => {
  if (props.type === 'text') {
    inputValue.value += ' ';
    emitValue();
  }
};

const handleClear = () => {
  inputValue.value = '';
  emitValue();
};

const emitValue = () => {
  const value =
    props.type === 'number' || props.type === 'currency'
      ? parseFloat(inputValue.value) || 0
      : inputValue.value;
  emit('update:modelValue', value);
};

const closeKeyboard = () => {
  emit('update:show', false);
  emit('close');
};
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-full"
  >
    <div
      v-if="show"
      class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl"
    >
      <div class="max-w-4xl mx-auto p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Keyboard class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{
                type === 'text'
                  ? 'Virtual Keyboard'
                  : type === 'number'
                    ? 'Number Pad'
                    : 'Currency Pad'
              }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="type === 'text'"
              class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              @click="toggleLanguage"
            >
              <Globe class="w-5 h-5" />
              <span class="text-sm font-medium">
                {{ currentLanguage === 'en' ? 'EN' : 'ខ្មែរ' }}
              </span>
            </button>

            <button
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="closeKeyboard"
            >
              <X class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
          <div
            class="text-lg font-mono text-gray-900 dark:text-white min-h-[2rem] break-all"
          >
            {{ inputValue || '&nbsp;' }}
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="(row, rowIndex) in keyboardLayout"
            :key="rowIndex"
            class="flex justify-center gap-1"
          >
            <button
              v-for="(key, keyIndex) in row"
              :key="keyIndex"
              class="flex-1 max-w-[4rem] px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-900 dark:text-white transition-all active:scale-95 shadow-sm"
              @click="handleKeyPress(key)"
            >
              {{ key }}
            </button>
          </div>

          <div class="flex justify-center gap-1 mt-2">
            <button
              v-if="type === 'text'"
              :class="[
                'px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-all active:scale-95 shadow-sm',
                capsLock
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
              ]"
              @click="toggleCapsLock"
            >
              Caps
            </button>

            <button
              class="flex-1 max-w-md px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-900 dark:text-white transition-all active:scale-95 shadow-sm"
              @click="handleSpace"
            >
              Space
            </button>

            <button
              class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white border border-red-600 rounded-lg font-medium transition-all active:scale-95 shadow-sm"
              @click="handleBackspace"
            >
              ⌫
            </button>

            <button
              class="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-lg font-medium transition-all active:scale-95 shadow-sm"
              @click="handleClear"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 bg-black/30 z-40"
      @click="closeKeyboard"
    ></div>
  </Transition>
</template>
