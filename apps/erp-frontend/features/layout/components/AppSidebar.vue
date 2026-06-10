<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '../composables/useLayout';
import type { MenuSection } from '@/config/menu.config';

interface Props {
  sections: MenuSection[];
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();
const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useLayout();
const { user } = useAuth();

const lastLoginText = computed(() => {
  if (!user.value?.lastLoginAt) return 'First login';
  const date = new Date(user.value.lastLoginAt);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(`${path}/`);
};

function navigate(path: string) {
  router.push(path);
  closeMobileSidebar();
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="mobileSidebarOpen"
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    @click="closeMobileSidebar"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-14 bottom-0 left-0 z-40 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border transition-all duration-300 flex flex-col',
      sidebarCollapsed ? 'w-16' : 'w-64',
      mobileSidebarOpen
        ? 'translate-x-0'
        : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="(section, sIdx) in props.sections" :key="sIdx" class="mb-6">
        <h3
          v-if="!sidebarCollapsed"
          class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
        >
          {{ section.title }}
        </h3>
        <ul class="space-y-1 px-2">
          <li v-for="item in section.items" :key="item.path">
            <button
              :class="[
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                sidebarCollapsed ? 'justify-center' : '',
              ]"
              :title="sidebarCollapsed ? item.label : undefined"
              @click="navigate(item.path)"
            >
              <svg
                v-if="item.icon"
                class="flex-shrink-0 w-5 h-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :d="item.icon"
                />
              </svg>
              <svg
                v-else
                class="flex-shrink-0 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span v-if="!sidebarCollapsed" class="truncate">{{
                item.label
              }}</span>
              <span
                v-if="!sidebarCollapsed && item.badge"
                class="ml-auto bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs px-2 py-0.5 rounded-full"
              >
                {{ item.badge }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Last Login -->
    <div
      v-if="!sidebarCollapsed"
      class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 shrink-0"
    >
      <div
        class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
      >
        <svg
          class="w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="truncate">
          <span class="font-medium">Last login</span>
          <span class="block">{{ lastLoginText }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
