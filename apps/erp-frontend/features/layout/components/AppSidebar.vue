<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '../composables/useLayout';
import { useLocale } from '@/composables/useLocale';
import type { Locale } from '@/i18n';
import {
  Zap,
  PanelLeft,
  PanelRight,
  ChevronRight,
  LogOut,
  Globe,
  Check,
  Settings,
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next';
import { useTheme, type Theme } from '@/composables/useTheme';
import type { MenuItem, MenuSection } from '@/config/menu.config';

interface Props {
  sections: MenuSection[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  action: [action: string];
}>();
const route = useRoute();
const router = useRouter();
const {
  sidebarCollapsed,
  sidebarHidden,
  sidebarWidth,
  mobileSidebarOpen,
  closeMobileSidebar,
  toggleSidebar,
} = useLayout();
const { user, logout } = useAuth();
const { locale, setLocale } = useLocale();
const { theme, setTheme } = useTheme();

const userMenuOpen = ref(false);
const langMenuOpen = ref(false);
const themeMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
  if (!userMenuOpen.value) {
    langMenuOpen.value = false;
    themeMenuOpen.value = false;
  }
}

function closeUserMenu() {
  userMenuOpen.value = false;
  langMenuOpen.value = false;
  themeMenuOpen.value = false;
}

function toggleLangMenu() {
  langMenuOpen.value = !langMenuOpen.value;
  if (langMenuOpen.value) themeMenuOpen.value = false;
}

function toggleThemeMenu() {
  themeMenuOpen.value = !themeMenuOpen.value;
  if (themeMenuOpen.value) langMenuOpen.value = false;
}

function selectLocale(lang: Locale) {
  setLocale(lang);
  langMenuOpen.value = false;
}

function selectTheme(value: Theme) {
  setTheme(value);
  themeMenuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false;
    langMenuOpen.value = false;
    themeMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

async function handleLogout() {
  await logout();
  closeUserMenu();
}

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

const userInitials = computed(() => {
  if (!user.value) return 'U';
  const first = user.value.firstName?.charAt(0) ?? '';
  const last = user.value.lastName?.charAt(0) ?? '';
  return (
    `${first}${last}`.toUpperCase() || user.value.email.charAt(0).toUpperCase()
  );
});

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(`${path}/`);
};

function navigate(path: string) {
  router.push(path);
  closeMobileSidebar();
}

function handleItemClick(item: MenuItem) {
  if (item.action) {
    emit('action', item.action);
    closeMobileSidebar();
  } else {
    navigate(item.path);
  }
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
        'shrink-0 h-14 sm:h-16 flex items-center justify-start border-b border-gray-200 dark:border-dark-border w-full relative',
        sidebarCollapsed ? 'cursor-pointer' : 'px-3 xl:px-4 2xl:px-5',
      ]"
      :title="sidebarCollapsed ? 'Expand sidebar' : undefined"
      @click="sidebarCollapsed && toggleSidebar()"
    >
      <!-- Collapsed: just ABA -->
      <div
        v-if="sidebarCollapsed"
        class="text-brand text-aba font-extrabold text-lg tracking-[0.04em] dark:text-[#80cbc4]"
      >
        ABA
      </div>
      <!-- Expanded: ABA' Financial -->
      <div v-else class="inline-flex items-center">
        <span
          class="text-aba font-extrabold text-xl tracking-[0.04em] dark:text-[#80cbc4]"
        >
          ABA
        </span>
        <span class="text-lg font-extrabold text-accent relative -top-0.5">
          '
        </span>
        <span
          class="text-financial font-semibold text-lg tracking-[-0.01em] ml-1 dark:text-[#4fc3f7]"
        >
          Financial
        </span>
      </div>

      <!-- Toggle (expanded only) -->
      <button
        v-if="!sidebarCollapsed"
        class="absolute right-3 xl:right-4 2xl:right-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-dark-text-tertiary dark:hover:bg-dark-bg-hover transition-colors shrink-0"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click.stop="toggleSidebar"
      >
        <PanelLeft class="w-4 h-4" />
      </button>
    </div>

    <!-- Floating toggle for collapsed sidebar -->
    <button
      v-if="sidebarCollapsed"
      class="absolute -right-4 sm:-right-4 top-3 sm:top-4 z-50 w-6 sm:w-7 h-8 rounded-r bg-white dark:bg-dark-bg-secondary shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-dark-text-secondary dark:hover:text-dark-text dark:hover:bg-dark-bg-hover transition-colors cursor-pointer"
      title="Expand sidebar"
      @click="toggleSidebar"
    >
      <PanelRight class="w-4 h-4" />
    </button>

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
              @click="handleItemClick(item)"
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

    <!-- User Profile Card + Menu -->
    <div
      ref="userMenuRef"
      class="border-t border-gray-200 dark:border-dark-border shrink-0 relative"
    >
      <!-- Expanded card -->
      <button
        v-if="!sidebarCollapsed"
        class="w-full flex items-center gap-3 px-3 xl:px-4 2xl:px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors text-left"
        @click.stop="toggleUserMenu"
      >
        <div class="relative shrink-0">
          <div
            class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold"
          >
            {{ userInitials }}
          </div>
          <span
            class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-dark-bg-secondary"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-sm font-medium text-gray-900 dark:text-dark-text truncate"
          >
            {{
              user?.firstName
                ? `${user.firstName} ${user.lastName}`
                : user?.email
            }}
          </p>
          <p
            class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate"
          >
            {{ user?.email }}
          </p>
        </div>
        <ChevronRight
          class="w-4 h-4 text-gray-400 dark:text-dark-text-tertiary shrink-0 transition-transform duration-200"
          :class="userMenuOpen ? 'rotate-90' : ''"
        />
      </button>

      <!-- Collapsed: avatar only -->
      <button
        v-else
        class="w-full flex items-center justify-center py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors"
        @click.stop="toggleUserMenu"
      >
        <div class="relative">
          <div
            class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold"
          >
            {{ userInitials }}
          </div>
          <span
            class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-dark-bg-secondary"
          />
        </div>
      </button>

      <!-- Expanded: dropdown above card -->
      <div
        v-show="userMenuOpen && !sidebarCollapsed"
        class="fixed left-2 bottom-16 w-56 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-[100]"
      >
        <!-- User info header -->
        <div class="px-3 py-2.5 flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-medium text-gray-900 dark:text-dark-text truncate"
            >
              {{
                user?.firstName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email
              }}
            </p>
            <p
              class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate"
            >
              {{ user?.email }}
            </p>
          </div>
          <ChevronRight
            class="w-4 h-4 text-gray-400 dark:text-dark-text-tertiary shrink-0"
          />
        </div>

        <div class="mx-3 border-t border-gray-100 dark:border-dark-border" />

        <!-- Profile -->
        <button
          class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
          @click="
            closeUserMenu();
            navigate('/profile');
          "
        >
          <Settings
            class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
          />
          Profile
        </button>

        <!-- Language with submenu -->
        <div class="relative">
          <button
            class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
            @click.stop="toggleLangMenu"
          >
            <Globe
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
            />
            <span class="flex-1 text-left">Language</span>
            <span
              class="text-xs text-gray-400 dark:text-dark-text-tertiary mr-1"
            >
              {{ locale === 'en' ? 'English' : 'ខ្មែរ' }}
            </span>
            <ChevronRight
              class="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-tertiary shrink-0 transition-transform duration-200"
              :class="langMenuOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            v-show="langMenuOpen"
            class="absolute left-full top-0 -ml-1 w-40 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-[110] overflow-hidden py-1"
          >
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                locale === 'en'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectLocale('en')"
            >
              <Check v-if="locale === 'en'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              English
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                locale === 'km'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectLocale('km')"
            >
              <Check v-if="locale === 'km'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              ខ្មែរ
            </button>
          </div>
        </div>

        <!-- Appearance / Theme with submenu -->
        <div class="relative">
          <button
            class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
            @click.stop="toggleThemeMenu"
          >
            <component
              :is="theme === 'dark' ? Moon : Sun"
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
            />
            <span class="flex-1 text-left">Appearance</span>
            <span
              class="text-xs text-gray-400 dark:text-dark-text-tertiary mr-1 capitalize"
            >
              {{ theme }}
            </span>
            <ChevronRight
              class="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-tertiary shrink-0 transition-transform duration-200"
              :class="themeMenuOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            v-show="themeMenuOpen"
            class="absolute left-full top-0 -ml-1 w-40 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-[110] overflow-hidden py-1"
          >
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'light'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('light')"
            >
              <Check v-if="theme === 'light'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Sun class="w-3.5 h-3.5" />
              Light
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'dark'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('dark')"
            >
              <Check v-if="theme === 'dark'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Moon class="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'system'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('system')"
            >
              <Check v-if="theme === 'system'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Monitor class="w-3.5 h-3.5" />
              System
            </button>
          </div>
        </div>

        <div class="mx-3 border-t border-gray-100 dark:border-dark-border" />

        <!-- Logout -->
        <button
          class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-xl"
          @click="handleLogout()"
        >
          <LogOut
            class="w-4 h-4 text-red-500 dark:text-red-400 transition-colors"
          />
          Logout
        </button>
      </div>

      <!-- Collapsed: dropdown to the right -->
      <div
        v-show="userMenuOpen && sidebarCollapsed"
        class="fixed left-10 bottom-[3rem] mb-0 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-[100] w-56"
      >
        <!-- User info header -->
        <div class="px-3 py-2.5 flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-medium text-gray-900 dark:text-dark-text truncate"
            >
              {{
                user?.firstName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email
              }}
            </p>
            <p
              class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate"
            >
              {{ user?.email }}
            </p>
          </div>
          <ChevronRight
            class="w-4 h-4 text-gray-400 dark:text-dark-text-tertiary shrink-0"
          />
        </div>

        <div class="mx-3 border-t border-gray-100 dark:border-dark-border" />

        <!-- Profile -->
        <button
          class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
          @click="
            closeUserMenu();
            navigate('/profile');
          "
        >
          <Settings
            class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
          />
          Profile
        </button>

        <!-- Language with submenu -->
        <div class="relative">
          <button
            class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
            @click.stop="toggleLangMenu"
          >
            <Globe
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
            />
            <span class="flex-1 text-left">Language</span>
            <span
              class="text-xs text-gray-400 dark:text-dark-text-tertiary mr-1"
            >
              {{ locale === 'en' ? 'English' : 'ខ្មែរ' }}
            </span>
            <ChevronRight
              class="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-tertiary shrink-0 transition-transform duration-200"
              :class="langMenuOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            v-show="langMenuOpen"
            class="absolute left-full top-0 -ml-1 w-40 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-[110] overflow-hidden py-1"
          >
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                locale === 'en'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectLocale('en')"
            >
              <Check v-if="locale === 'en'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              English
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                locale === 'km'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectLocale('km')"
            >
              <Check v-if="locale === 'km'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              ខ្មែរ
            </button>
          </div>
        </div>

        <!-- Appearance / Theme with submenu -->
        <div class="relative">
          <button
            class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
            @click.stop="toggleThemeMenu"
          >
            <component
              :is="theme === 'dark' ? Moon : Sun"
              class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary transition-colors"
            />
            <span class="flex-1 text-left">Appearance</span>
            <span
              class="text-xs text-gray-400 dark:text-dark-text-tertiary mr-1 capitalize"
            >
              {{ theme }}
            </span>
            <ChevronRight
              class="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-tertiary shrink-0 transition-transform duration-200"
              :class="themeMenuOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            v-show="themeMenuOpen"
            class="absolute left-full top-0 -ml-1 w-40 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-[110] overflow-hidden py-1"
          >
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'light'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('light')"
            >
              <Check v-if="theme === 'light'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Sun class="w-3.5 h-3.5" />
              Light
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'dark'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('dark')"
            >
              <Check v-if="theme === 'dark'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Moon class="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              class="group w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors"
              :class="
                theme === 'system'
                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover'
              "
              @click="selectTheme('system')"
            >
              <Check v-if="theme === 'system'" class="w-3.5 h-3.5" />
              <span v-else class="w-3.5 h-3.5" />
              <Monitor class="w-3.5 h-3.5" />
              System
            </button>
          </div>
        </div>

        <div class="mx-3 border-t border-gray-100 dark:border-dark-border" />

        <!-- Logout -->
        <button
          class="group w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-xl"
          @click="handleLogout()"
        >
          <LogOut
            class="w-4 h-4 text-red-500 dark:text-red-400 transition-colors"
          />
          Logout
        </button>
      </div>
    </div>
  </aside>
</template>
