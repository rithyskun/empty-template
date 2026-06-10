<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '../composables/useLayout';
import { Menu, LogOut, User } from 'lucide-vue-next';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import Breadcrumb from '@/components/ui/Breadcrumb.vue';

const router = useRouter();
const { user, logout } = useAuth();
const { sidebarCollapsed, sidebarHidden, openMobileSidebar } = useLayout();

const headerLeftClass = computed(() => {
  if (sidebarHidden.value) return 'left-0';
  if (sidebarCollapsed.value)
    return 'lg:left-16 xl:left-16 2xl:left-16 3xl:left-16';
  return 'lg:left-64 xl:left-72 2xl:left-80 3xl:left-80';
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

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function closeDropdown() {
  dropdownOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
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

    <div class="flex items-center gap-1 sm:gap-2">
      <ThemeToggle />
      <LanguageSwitcher class="hidden sm:block" />
      <div ref="dropdownRef" class="relative">
        <button
          class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-700 transition-all"
          :title="
            user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email
          "
          @click.stop="toggleDropdown"
        >
          {{ userInitials }}
        </button>

        <div
          v-show="dropdownOpen"
          class="absolute right-0 mt-2 w-44 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg py-1 z-50 overflow-hidden"
        >
          <button
            class="group w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            @click="
              closeDropdown();
              router.push('/profile');
            "
          >
            <User
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary group-hover:text-gray-700 dark:group-hover:text-dark-text-secondary transition-colors"
            />
            Profile
          </button>
          <div class="mx-3 border-t border-gray-100 dark:border-dark-border" />
          <button
            class="group w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            @click="
              closeDropdown();
              handleLogout();
            "
          >
            <LogOut
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary group-hover:text-gray-700 dark:group-hover:text-dark-text-secondary transition-colors"
            />
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
