<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '../composables/useLayout';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const router = useRouter();
const { user, logout } = useAuth();
const {
  sidebarMode,
  sidebarCollapsed,
  sidebarHidden,
  toggleSidebar,
  openMobileSidebar,
} = useLayout();

const headerLeftClass = computed(() => {
  if (sidebarHidden.value) return 'left-0';
  if (sidebarCollapsed.value) return 'lg:left-16';
  return 'lg:left-64';
});

const userInitials = computed(() => {
  if (!user.value) return 'U';
  const first = user.value.firstName?.charAt(0) ?? '';
  const last = user.value.lastName?.charAt(0) ?? '';
  return (
    `${first}${last}`.toUpperCase() || user.value.email.charAt(0).toUpperCase()
  );
});

async function handleLogout() {
  await logout();
}

function goHome() {
  router.push('/dashboard');
}
</script>

<template>
  <header
    :class="[
      'h-14 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-4 fixed top-0 right-0 z-30 transition-all duration-300',
      headerLeftClass,
    ]"
  >
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover lg:hidden"
        @click="openMobileSidebar"
      >
        <svg
          class="w-5 h-5 text-gray-600 dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover hidden lg:block"
        :title="
          sidebarMode === 'expanded'
            ? 'Collapse sidebar'
            : sidebarMode === 'collapsed'
              ? 'Hide sidebar'
              : 'Show sidebar'
        "
        @click="toggleSidebar"
      >
        <!-- Expanded → collapse icon -->
        <svg
          v-if="sidebarMode === 'expanded'"
          class="w-5 h-5 text-gray-600 dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11 17l-5-5 5-5M18 17l-5-5 5-5"
          />
        </svg>
        <!-- Collapsed → hide icon -->
        <svg
          v-else-if="sidebarMode === 'collapsed'"
          class="w-5 h-5 text-gray-600 dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <!-- Hidden → show icon -->
        <svg
          v-else
          class="w-5 h-5 text-gray-600 dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div
        class="text-lg font-bold text-primary-700 dark:text-primary-400 cursor-pointer select-none"
        @click="goHome"
      >
        ERP Financial
      </div>
    </div>

    <div class="flex items-center gap-2">
      <ThemeToggle />
      <LanguageSwitcher />
      <button
        class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-700 transition-all"
        :title="
          user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email
        "
        @click="router.push('/profile')"
      >
        {{ userInitials }}
      </button>
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover text-gray-600 dark:text-dark-text-secondary"
        title="Logout"
        @click="handleLogout"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  </header>
</template>
