<script setup lang="ts">
import { useLayout } from '@features/layout/composables/useLayout';

const { setSidebarTitle } = useLayout();
setSidebarTitle('Advances');
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Advances
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Manage employee advances and track repayment schedules.
      </p>
    </div>

    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <svg
          class="w-8 h-8 text-emerald-600 dark:text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
        Advances Module
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
        This is a placeholder for the Advances feature. Use the sidebar to
        navigate between dashboard, new advances, repayment schedules, and
        history.
      </p>
    </div>
  </div>
</template>
