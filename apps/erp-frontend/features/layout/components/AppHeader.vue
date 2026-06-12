<script setup lang="ts">
import { computed } from 'vue';
import { useLayout } from '../composables/useLayout';
import { Menu } from 'lucide-vue-next';
import Breadcrumb from '@/components/ui/Breadcrumb.vue';

const { sidebarCollapsed, sidebarHidden, openMobileSidebar } = useLayout();

const headerLeftClass = computed(() => {
  if (sidebarHidden.value) return 'left-0';
  if (sidebarCollapsed.value) return 'lg:left-20';
  return 'lg:left-64';
});
</script>

<template>
  <header
    :class="[
      'h-14 sm:h-16 bg-gray-50/80 dark:bg-dark-bg/80 backdrop-blur-md backdrop-saturate-150 flex items-center justify-between px-3 sm:px-4 md:px-6 fixed top-0 left-0 right-0 z-30 transition-all duration-300',
      headerLeftClass,
    ]"
  >
    <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover lg:hidden shrink-0"
        @click="openMobileSidebar"
      >
        <Menu class="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
      </button>
      <Breadcrumb class="hidden sm:flex min-w-0" />
    </div>

    <div class="flex items-center gap-1 sm:gap-2" />
  </header>
</template>
