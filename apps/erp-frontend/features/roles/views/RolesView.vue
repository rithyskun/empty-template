<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  Key,
  CheckCircle,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-vue-next';
import { useFetchApi } from '@/composables/useFetchApi';
import type { Role, Permission } from '@features/auth/types';
import type { RoleListItem } from '../types';

const { t } = useI18n();

// Props for detail view
defineProps<{
  id?: string;
}>();

const api = useFetchApi();

// Reactive state
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingRole = ref<RoleListItem | null>(null);
const deletingRole = ref<RoleListItem | null>(null);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref<string>('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalRoles = ref(0);
const error = ref<string | null>(null);

// Form data
const roleForm = ref({
  name: '',
  slug: '',
  description: '',
  permissions: [] as string[],
  isActive: true,
});

const isSaving = ref(false);
const formError = ref<string | null>(null);
const permissionSearchQuery = ref('');
const expandedModules = reactive<Record<string, boolean>>({});

// Data
const availablePermissions = ref<Permission[]>([]);
const roles = ref<RoleListItem[]>([]);

// Statistics
const roleStats = ref({
  totalRoles: 0,
  activeRoles: 0,
  inactiveRoles: 0,
  totalPermissions: 0,
});

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const transformApiRole = (apiRole: Role): RoleListItem => {
  return {
    id: apiRole.id,
    name: apiRole.name,
    slug: apiRole.slug,
    description: apiRole.description ?? '',
    permissionSlugs: (apiRole.permissions ?? []).map((p: Permission) => p.slug),
    permissionIds: (apiRole.permissions ?? []).map((p: Permission) => p.id),
    permissionObjects: apiRole.permissions ?? [],
    status: apiRole.isActive ? 'active' : 'inactive',
    userCount: apiRole.userCount || 0,
    createdAt: apiRole.createdAt ?? '',
  };
};

// Fetch roles from API
const fetchRoles = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params: Record<string, string | boolean | undefined> = {
      search: searchQuery.value || undefined,
      sortOrder: 'DESC',
    };

    // Add isActive filter if status filter is set
    if (statusFilter.value === 'active') {
      params.isActive = true;
    } else if (statusFilter.value === 'inactive') {
      params.isActive = false;
    }

    const response = await api.fetchApi<{ data: Role[]; total: number }>(
      '/roles',
      {
        params,
      },
    );

    roles.value = response.data.data.map(transformApiRole);
    totalRoles.value = response.data.total;
  } catch (err: any) {
    error.value = err?.message || 'Failed to fetch roles';
    console.error('Error fetching roles:', err);
  } finally {
    loading.value = false;
  }
};

// Fetch role statistics
const fetchRoleStats = async () => {
  try {
    const response = await api.fetchApi<{
      total: number;
      active: number;
      inactive: number;
      withPermissions: number;
    }>('/roles/stats');
    roleStats.value = {
      totalRoles: response.data.total,
      activeRoles: response.data.active,
      inactiveRoles: response.data.inactive,
      totalPermissions: response.data.withPermissions,
    };
  } catch (err) {
    console.error('Error fetching role stats:', err as Error);
  }
};

// Fetch available permissions
const fetchPermissions = async () => {
  try {
    const response = await api.fetchApi<{ data: Permission[]; total: number }>(
      '/permissions',
      {
        params: {
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          limit: 1000, // Fetch all permissions
        },
      },
    );
    availablePermissions.value = response.data.data;
  } catch (err) {
    console.error('Error fetching permissions:', err as Error);
  }
};

// Computed properties
const totalPages = computed(() => Math.ceil(totalRoles.value / pageSize.value));

const filteredPermissions = computed(() => {
  if (!permissionSearchQuery.value) {
    return availablePermissions.value;
  }
  const query = permissionSearchQuery.value.toLowerCase();
  return availablePermissions.value.filter(
    (permission: Permission) =>
      permission.name.toLowerCase().includes(query) ||
      permission.slug.toLowerCase().includes(query) ||
      (permission.module ?? '').toLowerCase().includes(query),
  );
});

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};
  for (const permission of filteredPermissions.value) {
    const mod = permission.module || 'General';
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(permission);
  }
  return groups;
});

const sortedModuleNames = computed(() =>
  Object.keys(groupedPermissions.value).sort(),
);

const isModuleExpanded = (mod: string): boolean => {
  if (expandedModules[mod] === undefined) return true;
  return expandedModules[mod];
};

const toggleModule = (mod: string): void => {
  expandedModules[mod] = !isModuleExpanded(mod);
};

const isModuleFullySelected = (mod: string): boolean => {
  const perms = groupedPermissions.value[mod] ?? [];
  return (
    perms.length > 0 &&
    perms.every((p) => roleForm.value.permissions.includes(p.id))
  );
};

const isModulePartiallySelected = (mod: string): boolean => {
  const perms = groupedPermissions.value[mod] ?? [];
  return (
    perms.some((p) => roleForm.value.permissions.includes(p.id)) &&
    !isModuleFullySelected(mod)
  );
};

const toggleModulePermissions = (mod: string): void => {
  const perms = groupedPermissions.value[mod] ?? [];
  if (isModuleFullySelected(mod)) {
    const ids = new Set(perms.map((p) => p.id));
    roleForm.value.permissions = roleForm.value.permissions.filter(
      (id) => !ids.has(id),
    );
  } else {
    const existing = new Set(roleForm.value.permissions);
    perms.forEach((p) => existing.add(p.id));
    roleForm.value.permissions = Array.from(existing);
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchRoles();
  }
};

// Watch for filter changes and refetch
const applyFilters = () => {
  currentPage.value = 1;
  fetchRoles();
};

const editRole = (role: RoleListItem) => {
  editingRole.value = role;
  roleForm.value = {
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: [...role.permissionIds],
    isActive: role.status === 'active',
  };
  showEditModal.value = true;
};

const showDeleteConfirmation = (role: RoleListItem) => {
  deletingRole.value = role;
  showDeleteModal.value = true;
};

const deleteRole = async () => {
  if (!deletingRole.value) return;

  isDeleting.value = true;
  deleteError.value = null;
  try {
    await api.deleteApi(`/roles/${deletingRole.value.id}`);
    showDeleteModal.value = false;
    deletingRole.value = null;
    await fetchRoles();
    await fetchRoleStats();
  } catch (err) {
    deleteError.value = (err as Error)?.message || 'Failed to delete role';
  } finally {
    isDeleting.value = false;
  }
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deletingRole.value = null;
  isDeleting.value = false;
  deleteError.value = null;
};

const toggleRoleStatus = async (role: RoleListItem) => {
  try {
    const newStatus = role.status === 'active' ? 'inactive' : 'active';
    await api.putApi(`/roles/${role.id}`, {
      isActive: newStatus === 'active',
    });
    role.status = newStatus;
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to update role status';
    setTimeout(() => {
      error.value = null;
    }, 5000);
  }
};

const saveRole = async () => {
  isSaving.value = true;
  formError.value = null;

  try {
    if (editingRole.value) {
      // Update existing role
      await api.putApi(`/roles/${editingRole.value.id}`, {
        name: roleForm.value.name,
        slug: roleForm.value.slug,
        description: roleForm.value.description,
        permissionIds: roleForm.value.permissions,
        isActive: roleForm.value.isActive,
      });
    } else {
      // Create new role
      await api.postApi('/roles', {
        name: roleForm.value.name,
        slug: roleForm.value.slug,
        description: roleForm.value.description,
        permissionIds: roleForm.value.permissions,
        isActive: roleForm.value.isActive,
      });
    }

    await fetchRoles();
    await fetchRoleStats();
    closeModal();
  } catch (err: any) {
    formError.value = err?.message || 'Failed to save role';
  } finally {
    isSaving.value = false;
  }
};

const selectAllPermissions = () => {
  roleForm.value.permissions = availablePermissions.value.map(
    (p: Permission) => p.id,
  );
};

const selectAllFilteredPermissions = () => {
  const filteredIds = filteredPermissions.value.map((p: Permission) => p.id);
  const uniquePermissions = new Set([
    ...roleForm.value.permissions,
    ...filteredIds,
  ]);
  roleForm.value.permissions = Array.from(uniquePermissions);
};

const deselectAllFilteredPermissions = () => {
  const filteredIds = new Set(
    filteredPermissions.value.map((p: Permission) => p.id),
  );
  roleForm.value.permissions = roleForm.value.permissions.filter(
    (id) => !filteredIds.has(id),
  );
};

const deselectAllPermissions = () => {
  roleForm.value.permissions = [];
};

const togglePermission = (permissionId: string) => {
  const index = roleForm.value.permissions.indexOf(permissionId);
  if (index > -1) {
    roleForm.value.permissions.splice(index, 1);
  } else {
    roleForm.value.permissions.push(permissionId);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingRole.value = null;
  formError.value = null;
  permissionSearchQuery.value = '';
  roleForm.value = {
    name: '',
    slug: '',
    description: '',
    permissions: [],
    isActive: true,
  };
};

// Load data on mount
onMounted(() => {
  fetchRoles();
  fetchPermissions();
  fetchRoleStats();
});
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6 sm:mb-8">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {{ t('roles.title') }}
          </h1>
          <p
            class="text-gray-600 dark:text-dark-text-secondary mt-1 text-sm sm:text-base"
          >
            {{ t('roles.subtitle') }}
          </p>
        </div>
        <button
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          @click="showCreateModal = true"
        >
          <Plus class="h-5 w-5" />
          {{ t('roles.addRole') }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Shield
              class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ t('roles.totalRoles') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ roles.length }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle
              class="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ t('roles.activeRoles') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ roleStats.activeRoles }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Users
              class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ t('roles.inactiveRoles') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ roleStats.inactiveRoles }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Key
              class="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ t('common.permissions') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ roleStats.totalPermissions }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 mb-6 transition-colors duration-200"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('roles.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @input="applyFilters"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
          @change="applyFilters"
        >
          <option value="">{{ t('roles.allStatus') }}</option>
          <option value="active">{{ t('common.active') }}</option>
          <option value="inactive">{{ t('common.inactive') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
    >
      <p class="text-sm text-red-800 dark:text-red-300">
        {{ error }}
      </p>
      <button
        type="button"
        class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        @click="fetchRoles()"
      >
        {{ t('roles.tryAgain') }}
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="roles.length === 0"
      class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 transition-colors duration-200"
    >
      <div class="text-center py-8 sm:py-12">
        <Shield
          class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {{ t('roles.noRolesFound') }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-dark-text-tertiary">
          {{ t('roles.getStarted') }}
        </p>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div
      v-else
      class="hidden lg:block bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 transition-colors duration-200"
    >
      <div class="overflow-x-auto">
        <table
          class="min-w-full divide-y divide-gray-200 dark:divide-dark-border"
        >
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('common.role') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('auditLog.description') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('common.permissions') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('common.users') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('roles.created') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ t('common.status') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border"
          >
            <tr
              v-for="role in roles"
              :key="role.id"
              class="hover:bg-gray-50 dark:hover:bg-dark-bg-hover"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                    >
                      <Shield
                        class="h-5 w-5 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ role.name }}
                    </div>
                    <div
                      class="text-sm text-gray-500 dark:text-dark-text-tertiary text-wrap"
                    >
                      ID: {{ role.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-dark-text">
                  {{ role.description }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="permission in role.permissionSlugs.slice(0, 2)"
                    :key="permission"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                  >
                    {{ permission }}
                  </span>
                  <span
                    v-if="role.permissionSlugs.length > 2"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-dark-bg-secondary text-gray-800 dark:text-dark-text-secondary"
                  >
                    +{{ role.permissionSlugs.length - 2 }} {{ t('roles.more') }}
                  </span>
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text"
              >
                {{ role.userCount }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-tertiary"
              >
                {{ formatDate(role.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    role.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  "
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{
                    role.status === 'active'
                      ? t('common.active')
                      : t('common.inactive')
                  }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                    :title="t('common.edit')"
                    @click="editRole(role)"
                  >
                    <Edit class="h-5 w-5" />
                  </button>
                  <button
                    :class="
                      role.status === 'active'
                        ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300'
                        : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                    "
                    class="p-1"
                    :title="
                      role.status === 'active'
                        ? t('roles.deactivate')
                        : t('roles.activate')
                    "
                    @click="toggleRoleStatus(role)"
                  >
                    <component
                      :is="role.status === 'active' ? 'X' : 'Check'"
                      class="h-5 w-5"
                    />
                  </button>
                  <button
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                    :title="t('common.delete')"
                    @click="showDeleteConfirmation(role)"
                  >
                    <Trash2 class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile card view -->
    <div v-if="!loading && !error" class="lg:hidden space-y-4">
      <div
        v-for="role in roles"
        :key="role.id"
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center min-w-0 flex-1">
            <div class="flex-shrink-0 h-10 w-10 mr-3">
              <div
                class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
              >
                <Shield class="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ role.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-dark-text-tertiary">
                ID: {{ role.id }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              title="Edit"
              @click="editRole(role)"
            >
              <Edit class="h-5 w-5" />
            </button>
            <button
              :class="
                role.status === 'active'
                  ? 'p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg'
                  : 'p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg'
              "
              :title="role.status === 'active' ? 'Deactivate' : 'Activate'"
              @click="toggleRoleStatus(role)"
            >
              <component
                :is="role.status === 'active' ? 'X' : 'Check'"
                class="h-5 w-5"
              />
            </button>
            <button
              class="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete"
              @click="showDeleteConfirmation(role)"
            >
              <Trash2 class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mb-3">
          <p class="text-sm text-gray-900 dark:text-dark-text">
            {{ role.description }}
          </p>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">
          <span
            v-for="permission in role.permissionSlugs.slice(0, 3)"
            :key="permission"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
          >
            {{ permission }}
          </span>
          <span
            v-if="role.permissionSlugs.length > 3"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-dark-bg-secondary text-gray-800 dark:text-dark-text-secondary"
          >
            +{{ role.permissionSlugs.length - 3 }} more
          </span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-900 dark:text-dark-text">
              <span class="font-medium">{{ role.userCount }}</span> users
            </div>
            <span
              :class="
                role.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              "
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            >
              {{
                role.status === 'active'
                  ? t('common.active')
                  : t('common.inactive')
              }}
            </span>
          </div>
          <div class="text-xs text-gray-500 dark:text-dark-text-tertiary">
            {{ t('roles.created') }}: {{ formatDate(role.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalRoles > pageSize"
      class="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-dark-border"
    >
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          class="text-sm text-gray-700 dark:text-dark-text-secondary text-center sm:text-left"
        >
          {{ t('roles.showing') }} {{ (currentPage - 1) * pageSize + 1 }}
          {{ t('roles.to') }} {{ Math.min(currentPage * pageSize, totalRoles) }}
          {{ t('roles.of') }} {{ totalRoles }} {{ t('roles.results') }}
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 border border-gray-300 dark:border-dark-border-light rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg-hover bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary"
            @click="goToPage(currentPage - 1)"
          >
            {{ t('common.previous') }}
          </button>
          <span
            class="px-3 py-1 text-sm text-gray-700 dark:text-dark-text-secondary"
          >
            {{ t('roles.page') }} {{ currentPage }} {{ t('roles.of') }}
            {{ totalPages }}
          </span>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border border-gray-300 dark:border-dark-border-light rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg-hover bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create/Edit Role Modal -->
  <div
    v-if="showCreateModal || showEditModal"
    class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="closeModal"
  >
    <div
      class="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border border-gray-200 dark:border-dark-border-light w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-dark-bg-secondary m-4 transition-colors duration-200"
    >
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ editingRole ? t('roles.editRole') : t('roles.createNewRole') }}
          </h3>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="closeModal()"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Error Message -->
        <div
          v-if="formError"
          class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-800 dark:text-red-300">
            {{ formError }}
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="saveRole()">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
              >{{ t('roles.roleName') }}</label
            >
            <input
              v-model="roleForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('roles.enterRoleName')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
              >{{ t('roles.roleSlug') }}</label
            >
            <input
              v-model="roleForm.slug"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('roles.slugPlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
              >{{ t('auditLog.description') }}</label
            >
            <textarea
              v-model="roleForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('roles.enterDescription')"
            ></textarea>
          </div>

          <div>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="roleForm.isActive"
                type="checkbox"
                class="rounded border-gray-300 dark:border-dark-border-light text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span
                class="ml-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary"
              >
                {{ t('roles.activeStatus') }}
              </span>
              <span
                class="ml-2 text-xs text-gray-500 dark:text-dark-text-tertiary"
              >
                ({{
                  roleForm.isActive
                    ? t('roles.roleIsActive')
                    : t('roles.roleIsInactive')
                }})
              </span>
            </label>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary"
                >{{ t('common.permissions') }} ({{
                  roleForm.permissions.length
                }}
                {{ t('roles.selected') }})</label
              >
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-xs px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 border border-blue-600 dark:border-blue-400 rounded"
                  @click="selectAllPermissions"
                >
                  {{ t('roles.selectAll') }}
                </button>
                <button
                  type="button"
                  class="text-xs px-3 py-1.5 text-gray-600 dark:text-dark-text-tertiary hover:text-white hover:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-dark-border-light rounded"
                  @click="deselectAllPermissions"
                >
                  {{ t('roles.deselectAll') }}
                </button>
              </div>
            </div>

            <!-- Permission Search Filter -->
            <div class="mb-3">
              <div class="relative">
                <Search
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                />
                <input
                  v-model="permissionSearchQuery"
                  type="text"
                  placeholder="Search permissions by name, slug, or module..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div
                v-if="permissionSearchQuery"
                class="flex items-center justify-between mt-2"
              >
                <p class="text-xs text-gray-600 dark:text-dark-text-tertiary">
                  Showing {{ filteredPermissions.length }} of
                  {{ availablePermissions.length }} permissions
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 border border-blue-600 dark:border-blue-400 rounded"
                    @click="selectAllFilteredPermissions"
                  >
                    Select Filtered
                  </button>
                  <button
                    type="button"
                    class="text-xs px-2 py-1 text-gray-600 dark:text-dark-text-tertiary hover:text-white hover:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-dark-border-light rounded"
                    @click="deselectAllFilteredPermissions"
                  >
                    Deselect Filtered
                  </button>
                </div>
              </div>
            </div>
            <!-- Empty state -->
            <div
              v-if="sortedModuleNames.length === 0"
              class="border border-gray-300 dark:border-dark-border-light rounded-lg px-4 py-8 text-center text-sm text-gray-500 dark:text-dark-text-tertiary"
            >
              No permissions found matching "{{ permissionSearchQuery }}"
            </div>

            <!-- Module-grouped accordion -->
            <div
              v-else
              class="border border-gray-300 dark:border-dark-border-light rounded-lg overflow-hidden max-h-96 overflow-y-auto"
            >
              <div
                v-for="(moduleName, idx) in sortedModuleNames"
                :key="moduleName"
                :class="
                  idx > 0
                    ? 'border-t border-gray-200 dark:border-dark-border'
                    : ''
                "
              >
                <!-- Module header row -->
                <div
                  class="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-dark-bg-hover/60 transition-colors"
                  @click="toggleModule(moduleName)"
                >
                  <!-- Module checkbox -->
                  <input
                    type="checkbox"
                    :checked="isModuleFullySelected(moduleName)"
                    :indeterminate="isModulePartiallySelected(moduleName)"
                    class="rounded border-gray-300 dark:border-dark-border-light text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    @click.stop
                    @change.stop="toggleModulePermissions(moduleName)"
                  />
                  <!-- Expand/collapse icon -->
                  <component
                    :is="
                      isModuleExpanded(moduleName) ? ChevronDown : ChevronRight
                    "
                    class="h-4 w-4 text-gray-500 dark:text-dark-text-tertiary flex-shrink-0"
                  />
                  <!-- Module name -->
                  <span
                    class="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize"
                  >
                    {{ moduleName }}
                  </span>
                  <!-- Count badge -->
                  <span
                    class="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium"
                  >
                    {{
                      groupedPermissions[moduleName].filter((p) =>
                        roleForm.permissions.includes(p.id),
                      ).length
                    }}
                    / {{ groupedPermissions[moduleName].length }}
                  </span>
                </div>

                <!-- Permission rows -->
                <div v-if="isModuleExpanded(moduleName)">
                  <div
                    v-for="(permission, pIdx) in groupedPermissions[moduleName]"
                    :key="permission.id"
                    :class="[
                      'flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors',
                      pIdx < groupedPermissions[moduleName].length - 1
                        ? 'border-b border-gray-100 dark:border-dark-border/50'
                        : '',
                    ]"
                    @click="togglePermission(permission.id)"
                  >
                    <!-- indent spacer -->
                    <span class="w-4 flex-shrink-0" />
                    <input
                      v-model="roleForm.permissions"
                      type="checkbox"
                      :value="permission.id"
                      class="rounded border-gray-300 dark:border-dark-border-light text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      @click.stop
                    />
                    <span
                      class="flex-1 text-sm text-gray-800 dark:text-gray-200"
                    >
                      {{ permission.name }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono"
                    >
                      {{ permission.slug }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4"
          >
            <button
              type="button"
              :disabled="isSaving"
              class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm w-full sm:w-auto bg-white dark:bg-dark-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              @click="closeModal()"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isSaving" class="animate-spin h-5 w-5" />
              <span>{{
                isSaving
                  ? t('roles.saving')
                  : editingRole
                    ? t('roles.updateRole')
                    : t('roles.createRole')
              }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
    @click.self="closeDeleteModal"
  >
    <div
      class="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-border"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
        >
          <Trash2 class="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('roles.deleteRole') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
            {{ t('roles.deleteConfirmation') }}
            <span class="font-semibold">{{ deletingRole?.name }}</span
            >?
          </p>
          <div
            v-if="deleteError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4"
          >
            <p class="text-sm text-red-800 dark:text-red-300">
              {{ deleteError }}
            </p>
          </div>
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4"
          >
            <p class="text-xs text-red-800 dark:text-red-300">
              <strong>{{ t('roles.danger') }}:</strong>
              {{ t('roles.deleteWarning') }}
            </p>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          @click="closeDeleteModal"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="deleteRole"
        >
          <Loader2 v-if="isDeleting" class="h-5 w-5 animate-spin" />
          <span>{{
            isDeleting ? t('roles.deleting') : t('roles.deleteRole')
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
