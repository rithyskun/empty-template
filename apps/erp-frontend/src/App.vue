<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

// Theme is automatically initialized when composable is imported
useTheme();
</script>

<template>
  <div
    class="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200"
  >
    <RouterView />
  </div>
</template>
