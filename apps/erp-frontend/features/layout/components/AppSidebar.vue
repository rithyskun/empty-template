<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '../composables/useLayout';
import { Clock, Zap } from 'lucide-vue-next';
import type { MenuSection } from '@/config/menu.config';

interface Props {
  sections: MenuSection[];
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();
const {
  sidebarCollapsed,
  sidebarHidden,
  sidebarWidth,
  mobileSidebarOpen,
  closeMobileSidebar,
} = useLayout();
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
      'fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border transition-all duration-300 flex flex-col',
      sidebarWidth,
      sidebarHidden
        ? '-translate-x-full'
        : mobileSidebarOpen
          ? 'translate-x-0'
          : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo -->
    <div
      :class="[
        'shrink-0 h-14 sm:h-16 flex items-center border-b border-gray-200 dark:border-dark-border',
        sidebarCollapsed
          ? 'justify-center'
          : 'gap-3 px-4 xl:px-5 2xl:px-6 3xl:px-6',
      ]"
    >
      <Zap
        class="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0"
      />
      <span
        v-if="!sidebarCollapsed"
        class="text-base sm:text-lg xl:text-lg 2xl:text-xl 3xl:text-xl font-bold text-gray-900 dark:text-dark-text tracking-tight truncate"
      >
        ABA ERP
      </span>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 sm:py-6">
      <div v-for="(section, sIdx) in props.sections" :key="sIdx" class="mb-6">
        <h3
          v-if="!sidebarCollapsed"
          class="px-4 xl:px-5 2xl:px-6 3xl:px-6 text-xs font-semibold text-gray-400 dark:text-dark-text-tertiary uppercase tracking-wider mb-2"
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
                  : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover',
                sidebarCollapsed ? 'justify-center' : '',
              ]"
              :title="sidebarCollapsed ? item.label : undefined"
              @click="navigate(item.path)"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="flex-shrink-0 w-5 h-5"
              />
              <Zap v-else class="flex-shrink-0 w-5 h-5" />
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
      class="border-t border-gray-200 dark:border-dark-border h-10 flex items-center px-4 xl:px-5 2xl:px-6 3xl:px-6 shrink-0"
    >
      <div
        class="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-tertiary w-full min-w-0"
      >
        <Clock class="w-3.5 h-3.5 flex-shrink-0" />
        <div class="truncate">
          <span class="font-medium">Last login</span>
          <span class="block leading-none">{{ lastLoginText }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
