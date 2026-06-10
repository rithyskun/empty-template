<script setup lang="ts">
import { useLayout } from '@features/layout/composables/useLayout';
import { Zap } from 'lucide-vue-next';

const { setSidebarTitle } = useLayout();
setSidebarTitle('Workflows');
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Workflows
      </h1>
      <p class="text-gray-600 dark:text-dark-text-tertiary mt-1">
        Design and monitor approval workflows.
      </p>
    </div>

    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-8 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center"
      >
        <Zap class="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-dark-text">
        Workflows Module
      </h3>
      <p
        class="text-gray-600 dark:text-dark-text-tertiary mt-2 max-w-md mx-auto"
      >
        This is a placeholder for the Workflows feature. Use the sidebar to
        navigate between dashboard, design, approvals, and history.
      </p>
    </div>
  </div>
</template>
