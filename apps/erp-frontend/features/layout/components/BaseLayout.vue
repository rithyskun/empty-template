<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import { useLayout } from '../composables/useLayout';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import AppFooter from './AppFooter.vue';
import Breadcrumb from '@/components/ui/Breadcrumb.vue';
import { menuSections } from '@/config/menu.config';
import type { MenuSection } from '@/config/menu.config';

const route = useRoute();
const { sidebarCollapsed, sidebarHidden } = useLayout();

const sidebarSections = computed<MenuSection[]>(() => {
  // If the current route meta defines a custom sidebar, use it
  const custom = route.meta.sidebarSections as MenuSection[] | undefined;
  if (custom && custom.length > 0) return custom;
  // Otherwise fall back to the default main menu
  return menuSections;
});

const contentMargin = computed(() => {
  if (sidebarHidden.value) return 'ml-0';
  if (sidebarCollapsed.value) return 'ml-16';
  return 'ml-64';
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col">
    <AppHeader />
    <AppSidebar :sections="sidebarSections" />

    <div
      :class="[
        'flex-1 flex flex-col pt-14 transition-all duration-300',
        contentMargin,
      ]"
    >
      <main class="flex-1 p-6 overflow-y-auto">
        <div class="mb-4">
          <Breadcrumb />
        </div>
        <RouterView />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
