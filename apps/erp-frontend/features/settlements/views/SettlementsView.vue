<script setup lang="ts">
import { useLayout } from '@features/layout/composables/useLayout';
import { CheckCircle } from 'lucide-vue-next';

const { setSidebarTitle } = useLayout();
setSidebarTitle('Settlements');
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Settlements
      </h1>
      <p class="text-gray-600 dark:text-dark-text-tertiary mt-1">
        Process and track batch settlements between banks.
      </p>
    </div>

    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-8 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
      >
        <CheckCircle class="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-dark-text">
        Settlements Module
      </h3>
      <p
        class="text-gray-600 dark:text-dark-text-tertiary mt-2 max-w-md mx-auto"
      >
        This is a placeholder for the Settlements feature. Use the sidebar to
        navigate between dashboard, new batch, pending settlements, and history.
      </p>
    </div>
  </div>
</template>
