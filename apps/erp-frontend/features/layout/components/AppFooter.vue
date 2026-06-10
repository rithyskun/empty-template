<script setup lang="ts">
const year = new Date().getFullYear();
const version =
  (import.meta.env as Record<string, unknown>).__APP_VERSION__ ?? '1.0.0';
</script>

<template>
  <footer
    class="h-10 bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border flex items-center justify-between px-4 text-xs text-gray-500 dark:text-gray-400"
  >
    <span>ERP Financial &copy; {{ year }}</span>
    <span>v{{ version }}</span>
  </footer>
</template>
