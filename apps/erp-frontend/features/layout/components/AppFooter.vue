<script setup lang="ts">
const year = new Date().getFullYear();
const version =
  (import.meta.env as Record<string, unknown>).__APP_VERSION__ ?? '1.0.0';
</script>

<template>
  <footer
    class="h-10 bg-gray-50 dark:bg-dark-bg flex items-center justify-between px-4 text-xs text-gray-500 dark:text-dark-text-tertiary"
  >
    <span>ABA Financial &copy; {{ year }}</span>
    <span>v{{ version }}</span>
  </footer>
</template>
