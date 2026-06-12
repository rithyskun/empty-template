<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import { useLayout } from '../composables/useLayout';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import AppFooter from './AppFooter.vue';
import { menuSections, filterMenuSections } from '@/config/menu.config';
import type { MenuSection } from '@/config/menu.config';
import { useAuth } from '@features/auth/composables/useAuth';
import { FileText, Plane } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { sidebarCollapsed, sidebarHidden } = useLayout();
const { user } = useAuth();

const showNewAdvanceModal = ref(false);

function handleSidebarAction(action: string) {
  if (action === 'new-advance-modal') {
    showNewAdvanceModal.value = true;
  }
}

function selectAdvanceType(type: 'department' | 'travel') {
  showNewAdvanceModal.value = false;
  router.push({
    path: '/advances/new',
    query: { type },
  });
}

const sidebarSections = computed<MenuSection[]>(() => {
  // If the current route meta defines a custom sidebar, use it
  const custom = route.meta.sidebarSections as MenuSection[] | undefined;
  const sections = custom && custom.length > 0 ? custom : menuSections;
  // Filter by user permissions and roles
  return filterMenuSections(
    sections,
    user.value?.permissions ?? [],
    user.value?.roles ?? [],
  );
});

const contentMargin = computed(() => {
  if (sidebarHidden.value) return 'ml-0';
  if (sidebarCollapsed.value) return 'lg:ml-20';
  return 'lg:ml-64 xl:ml-72 2xl:ml-80 3xl:ml-80';
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col">
    <AppHeader />
    <AppSidebar :sections="sidebarSections" @action="handleSidebarAction" />

    <div
      :class="[
        'flex-1 flex flex-col pt-14 sm:pt-16 transition-all duration-300',
        contentMargin,
      ]"
    >
      <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <RouterView @action="handleSidebarAction" />
      </main>
      <AppFooter />
    </div>

    <!-- New Advance Modal -->
    <div
      v-if="showNewAdvanceModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click="showNewAdvanceModal = false"
    >
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl border border-gray-200 dark:border-dark-border w-full max-w-sm mx-4 overflow-hidden"
        @click.stop
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">
            New Advance Request
          </h3>
          <p class="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
            Choose the type of advance you want to request
          </p>
        </div>
        <div class="p-4 space-y-3">
          <button
            class="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-dark-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group text-left"
            @click="selectAdvanceType('department')"
          >
            <div
              class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"
            >
              <FileText
                class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p
                class="font-medium text-gray-900 dark:text-dark-text group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
              >
                Advance for Department
              </p>
              <p class="text-xs text-gray-500 dark:text-dark-text-secondary">
                Standard advance request for department expenses
              </p>
            </div>
          </button>

          <button
            class="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group text-left"
            @click="selectAdvanceType('travel')"
          >
            <div
              class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
            >
              <Plane class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p
                class="font-medium text-gray-900 dark:text-dark-text group-hover:text-blue-700 dark:group-hover:text-blue-300"
              >
                Travel Allowance
              </p>
              <p class="text-xs text-gray-500 dark:text-dark-text-secondary">
                Request travel allowance for business trips
              </p>
            </div>
          </button>
        </div>
        <div
          class="px-6 py-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg rounded-b-xl"
        >
          <button
            class="w-full py-2 text-sm text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text transition-colors"
            @click="showNewAdvanceModal = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
