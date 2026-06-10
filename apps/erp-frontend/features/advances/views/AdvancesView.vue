<script setup lang="ts">
import { useLayout } from '@features/layout/composables/useLayout';
import { DollarSign } from 'lucide-vue-next';

const { setSidebarTitle } = useLayout();
setSidebarTitle('Advances');
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Advances
      </h1>
      <p class="text-gray-600 dark:text-dark-text-secondary mt-1">
        Manage employee advances and track repayment schedules.
      </p>
    </div>

    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-8 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <DollarSign class="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-dark-text">
        Advances Module
      </h3>
      <p
        class="text-gray-600 dark:text-dark-text-secondary mt-2 max-w-md mx-auto"
      >
        This is a placeholder for the Advances feature. Use the sidebar to
        navigate between dashboard, new advances, repayment schedules, and
        history.
      </p>
    </div>
  </div>
</template>
