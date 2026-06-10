<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useLayout } from '@features/layout/composables/useLayout';
import { Users, Shield, Key, ChevronRight } from 'lucide-vue-next';

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
    icon: Users,
  },
  {
    id: 'roles',
    label: 'Roles',
    description: 'Configure user roles and access levels',
    path: '/administration/roles',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor:
      'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30',
    icon: Shield,
  },
  {
    id: 'permissions',
    label: 'Permissions',
    description: 'Assign and review feature permissions',
    path: '/administration/permissions',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor:
      'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
    icon: Key,
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

    <div
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <button
        v-for="mod in modules"
        :key="mod.id"
        class="group text-left rounded-lg border border-gray-200 dark:border-dark-border p-4 transition-all duration-200 shadow-sm hover:shadow-md"
        :class="mod.bgColor"
        @click="navigate(mod.path)"
      >
        <div class="flex items-start justify-between mb-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-dark-bg-secondary shadow-sm"
          >
            <component :is="mod.icon" class="w-5 h-5" :class="mod.color" />
          </div>
          <ChevronRight
            class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
          />
        </div>
        <h3
          class="text-base font-semibold text-gray-900 dark:text-dark-text mb-0.5"
        >
          {{ mod.label }}
        </h3>
        <p
          class="text-xs text-gray-600 dark:text-dark-text-tertiary line-clamp-2"
        >
          {{ mod.description }}
        </p>
      </button>
    </div>
  </div>
</template>
