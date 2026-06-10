<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useLayout } from '@features/layout/composables/useLayout';

const router = useRouter();
const { setSidebarTitle } = useLayout();
setSidebarTitle('Administration');

const modules = [
  {
    id: 'users',
    label: 'Users',
    description: 'Manage system users, accounts and profiles',
    path: '/administration/users',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor:
      'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    id: 'roles',
    label: 'Roles',
    description: 'Configure user roles and access levels',
    path: '/administration/roles',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor:
      'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    description: 'Assign and review feature permissions',
    path: '/administration/permissions',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor:
      'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2.268a2 2 0 01-.586 1.414l-1.293 1.293a1 1 0 01-1.414 0l-1.293-1.293A2 2 0 012.268 20H2v-2h2v-2h2v-2h2.257A6 6 0 0115 7z',
  },
];

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Administration
      </h1>
      <p class="text-gray-600 dark:text-dark-text-secondary mt-1">
        System administration and access control
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <button
        v-for="mod in modules"
        :key="mod.id"
        class="group text-left rounded-xl border border-gray-200 dark:border-dark-border p-6 transition-all duration-200 shadow-sm hover:shadow-md"
        :class="mod.bgColor"
        @click="navigate(mod.path)"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center bg-white dark:bg-dark-bg-secondary shadow-sm"
          >
            <svg
              class="w-6 h-6"
              :class="mod.color"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="mod.icon"
              />
            </svg>
          </div>
          <svg
            class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-dark-text-secondary transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1"
        >
          {{ mod.label }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-dark-text-secondary">
          {{ mod.description }}
        </p>
      </button>
    </div>
  </div>
</template>
