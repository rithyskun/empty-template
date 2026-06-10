<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { ChevronRight, Inbox } from 'lucide-vue-next';
import { featureTiles } from '../config/features.config';

const router = useRouter();
const { user } = useAuth();

const userRoles = computed(() => user.value?.roles ?? []);

const visibleTiles = computed(() => {
  return featureTiles.filter((tile) => {
    if (!tile.requiredRole) return true;
    return (
      userRoles.value.includes(tile.requiredRole) ||
      userRoles.value.includes('ADMIN')
    );
  });
});

function navigateToFeature(path: string) {
  router.push(path);
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Welcome back, {{ user?.firstName || user?.email || 'User' }}
      </h1>
      <p class="text-gray-600 dark:text-dark-text-tertiary mt-1">
        Select a module below to get started
      </p>
    </div>

    <div
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <button
        v-for="tile in visibleTiles"
        :key="tile.id"
        class="group text-left rounded-lg border border-gray-200 dark:border-dark-border p-4 transition-all duration-200 shadow-sm hover:shadow-md"
        :class="tile.bgColor"
        @click="navigateToFeature(tile.path)"
      >
        <div class="flex items-start justify-between mb-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-dark-bg-secondary shadow-sm"
          >
            <component :is="tile.icon" class="w-5 h-5" :class="tile.color" />
          </div>
          <ChevronRight
            class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
          />
        </div>
        <h3
          class="text-base font-semibold text-gray-900 dark:text-dark-text mb-0.5"
        >
          {{ tile.label }}
        </h3>
        <p
          class="text-xs text-gray-600 dark:text-dark-text-tertiary line-clamp-2"
        >
          {{ tile.description }}
        </p>
      </button>
    </div>

    <div v-if="visibleTiles.length === 0" class="text-center py-20">
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-bg-secondary flex items-center justify-center"
      >
        <Inbox class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-dark-text">
        No modules available
      </h3>
      <p class="text-gray-600 dark:text-dark-text-tertiary mt-1">
        You don't have permission to access any modules yet.
      </p>
    </div>
  </div>
</template>
