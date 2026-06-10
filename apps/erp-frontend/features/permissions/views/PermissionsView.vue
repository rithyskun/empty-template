<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
} from 'lucide-vue-next';
import { useFetchApi } from '@/composables/useFetchApi';
import type { Permission } from '@/composables/useAuth';
import type { PermissionListItem } from '../types';

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
const editingPermission = ref<PermissionListItem | null>(null);
const deletingPermission = ref<PermissionListItem | null>(null);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const searchQuery = ref('');
const moduleFilter = ref('');
const actionFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalPermissions = ref(0);
const error = ref<string | null>(null);

// Form data
const permissionForm = ref({
  name: '',
  slug: '',
  module: '',
  description: '',
});

const isSaving = ref(false);
const formError = ref<string | null>(null);

// Data
const permissions = ref<PermissionListItem[]>([]);

// Stats from API
const permissionStats = ref({
  total: 0,
  system: 0,
  user: 0,
  role: 0,
  permission: 0,
  unused: 0,
});

// Helper functions
const extractModuleAndAction = (
  slug: string,
): { module: string; action: string } => {
  const parts = slug.split(':');
  return {
    module: parts[0] || '',
    action: parts[1] || '',
  };
};

const transformApiPermission = (
  apiPermission: Permission,
): PermissionListItem => {
  const { action } = extractModuleAndAction(apiPermission.slug);
  return {
    id: apiPermission.id,
    name: apiPermission.name,
    slug: apiPermission.slug,
    module: apiPermission.module || '', // Use module from API response
    action,
    description: apiPermission.description ?? '',
    rolesCount: 0, // This would come from a separate API call
    createdAt: apiPermission.createdAt ?? '',
  };
};

// Fetch permission usage (role counts)
const fetchPermissionUsage = async () => {
  try {
    const response = await api.fetchApi<any>('/permissions/usage');
    return response.data || [];
  } catch (err) {
    console.error('Error fetching permission usage:', err);
    return [];
  }
};

// Fetch permissions from API
const fetchPermissions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.fetchApi<{ data: Permission[]; total: number }>(
      '/permissions',
      {
        params: {
          page: currentPage.value,
          limit: pageSize.value,
          search: searchQuery.value || undefined,
          module: moduleFilter.value || undefined,
        },
      },
    );

    // Fetch permission usage data
    const permissionUsage = await fetchPermissionUsage();

    // Create a map of slug -> role count
    const roleCountMap = new Map<string, number>();
    permissionUsage.forEach((item: any) => {
      const permission = item.permission;
      const slug = permission?.slug;
      const roleCount = item.roleCount || 0;
      if (slug) {
        roleCountMap.set(slug, roleCount);
      }
    });

    // Transform permissions and add role counts
    permissions.value = response.data.data.map((perm: Permission) => {
      const transformed = transformApiPermission(perm);
      transformed.rolesCount = roleCountMap.get(perm.slug) || 0;
      return transformed;
    });

    totalPermissions.value = response.data.total;
  } catch (err: any) {
    error.value = err?.message || 'Failed to fetch permissions';
    console.error('Error fetching permissions:', err);
  } finally {
    loading.value = false;
  }
};

// Computed properties
const totalPages = computed(() =>
  Math.ceil(totalPermissions.value / pageSize.value),
);

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchPermissions();
  }
};

// Fetch permission stats from API
const fetchPermissionStats = async () => {
  try {
    const response = await api.fetchApi<{
      total: number;
      system: number;
      user: number;
      role: number;
      permission: number;
      unused: number;
    }>('/permissions/stats');

    permissionStats.value = response.data;
  } catch (err) {
    console.error('Error fetching permission stats:', err);
  }
};

// Watch for filter changes and refetch
const applyFilters = () => {
  currentPage.value = 1;
  fetchPermissions();
};

const editPermission = (permission: PermissionListItem) => {
  editingPermission.value = permission;
  permissionForm.value = {
    name: permission.name,
    slug: permission.slug,
    module: permission.module,
    description: permission.description,
  };
  showEditModal.value = true;
};

const showDeleteConfirmation = (permission: PermissionListItem) => {
  deletingPermission.value = permission;
  showDeleteModal.value = true;
};

const deletePermission = async () => {
  if (!deletingPermission.value) return;

  isDeleting.value = true;
  deleteError.value = null;
  try {
    await api.deleteApi(`/permissions/${deletingPermission.value.id}`);
    showDeleteModal.value = false;
    deletingPermission.value = null;
    await fetchPermissions();
    await fetchPermissionStats();
  } catch (err) {
    deleteError.value =
      (err as Error)?.message || 'Failed to delete permission';
  } finally {
    isDeleting.value = false;
  }
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deletingPermission.value = null;
  isDeleting.value = false;
  deleteError.value = null;
};

const savePermission = async () => {
  isSaving.value = true;
  formError.value = null;

  try {
    if (editingPermission.value) {
      // Update existing permission
      await api.putApi(`/permissions/${editingPermission.value.id}`, {
        name: permissionForm.value.name,
        slug: permissionForm.value.slug,
        description: permissionForm.value.description,
        module: permissionForm.value.module,
        metadata: null,
      });
    } else {
      // Create new permission
      await api.postApi('/permissions', {
        name: permissionForm.value.name,
        slug: permissionForm.value.slug,
        description: permissionForm.value.description,
        module: permissionForm.value.module,
        metadata: null,
      });
    }

    await fetchPermissions();
    await fetchPermissionStats();
    closeModal();
  } catch (err) {
    formError.value = (err as Error)?.message || 'Failed to save permission';
  } finally {
    isSaving.value = false;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingPermission.value = null;
  formError.value = null;
  permissionForm.value = {
    name: '',
    slug: '',
    module: '',
    description: '',
  };
};

// Load data on mount
onMounted(() => {
  fetchPermissions();
  fetchPermissionStats();
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
            {{ t('permissions.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            {{ t('permissions.subtitle') }}
          </p>
        </div>
        <button
          class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          @click="showCreateModal = true"
        >
          <Plus class="h-5 w-5" />
          {{ t('permissions.addPermission') }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Key
              class="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              {{ t('permissions.totalPermissions') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ permissionStats.total }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Shield
              class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              {{ t('permissions.systemPermissions') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ permissionStats.system }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Users
              class="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              {{ t('permissions.userPermissions') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ permissionStats.user }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <CheckCircle
              class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400"
            />
          </div>
          <div class="ml-3 sm:ml-4">
            <p
              class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              {{ t('permissions.rolePermissions') }}
            </p>
            <p
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ permissionStats.role }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-200"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('permissions.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @input="applyFilters"
          />
        </div>
        <select
          v-model="moduleFilter"
          class="px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
          @change="applyFilters"
        >
          <option value="">{{ t('permissions.allModules') }}</option>
          <option value="users">{{ t('common.users') }}</option>
          <option value="roles">{{ t('common.roles') }}</option>
          <option value="permissions">{{ t('common.permissions') }}</option>
          <option value="dashboard">{{ t('permissions.dashboard') }}</option>
          <option value="analytics">{{ t('permissions.analytics') }}</option>
          <option value="settings">{{ t('common.settings') }}</option>
        </select>
        <select
          v-model="actionFilter"
          class="px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
          @change="applyFilters"
        >
          <option value="">{{ t('permissions.allActions') }}</option>
          <option value="view">{{ t('permissions.view') }}</option>
          <option value="create">{{ t('common.create') }}</option>
          <option value="edit">{{ t('common.edit') }}</option>
          <option value="delete">{{ t('common.delete') }}</option>
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
        @click="fetchPermissions()"
      >
        {{ t('roles.tryAgain') }}
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="permissions.length === 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200"
    >
      <div class="text-center py-8 sm:py-12">
        <Key
          class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {{ t('permissions.noPermissionsFound') }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('permissions.getStarted') }}
        </p>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div
      v-else
      class="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ t('common.permission') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ t('roles.module') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ t('roles.slug') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ t('auditLog.description') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ t('permissions.rolesUsing') }}
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
            class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr
              v-for="permission in permissions"
              :key="permission.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    >
                      <Key class="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ permission.name }}
                    </div>
                    <div
                      class="text-sm text-gray-500 dark:text-gray-400 text-wrap"
                    >
                      ID: {{ permission.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                >
                  {{ permission.module }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                >
                  {{ permission.slug }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ permission.description }}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
              >
                {{ permission.rolesCount }}
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                    :title="t('common.edit')"
                    @click="editPermission(permission)"
                  >
                    <Edit class="h-5 w-5" />
                  </button>

                  <button
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                    :title="t('common.delete')"
                    @click="showDeleteConfirmation(permission)"
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
        v-for="permission in permissions"
        :key="permission.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center min-w-0 flex-1">
            <div class="flex-shrink-0 h-10 w-10 mr-3">
              <div
                class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <Key class="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ permission.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ID: {{ permission.id }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              title="Edit"
              @click="editPermission(permission)"
            >
              <Edit class="h-5 w-5" />
            </button>

            <button
              class="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete"
              @click="showDeleteConfirmation(permission)"
            >
              <Trash2 class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mb-3">
          <p class="text-sm text-gray-900 dark:text-gray-100">
            {{ permission.description }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 mb-3">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
          >
            {{ permission.module }}
          </span>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
          >
            {{ permission.slug }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-900 dark:text-gray-100">
            <span class="font-medium">{{ permission.rolesCount }}</span>
            {{ t('permissions.rolesUsing') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPermissions > pageSize"
      class="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          class="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left"
        >
          {{ t('roles.showing') }} {{ (currentPage - 1) * pageSize + 1 }}
          {{ t('roles.to') }}
          {{ Math.min(currentPage * pageSize, totalPermissions) }}
          {{ t('roles.of') }} {{ totalPermissions }} {{ t('roles.results') }}
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            type="button"
            :disabled="currentPage === 1"
            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            @click="goToPage(currentPage - 1)"
          >
            {{ t('common.previous') }}
          </button>
          <span class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            {{ t('roles.page') }} {{ currentPage }} {{ t('roles.of') }}
            {{ totalPages }}
          </span>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create/Edit Permission Modal -->
  <div
    v-if="showCreateModal || showEditModal"
    class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="closeModal"
  >
    <div
      class="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border border-gray-200 dark:border-gray-600 w-full max-w-md sm:w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 m-4 transition-colors duration-200"
    >
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{
              editingPermission
                ? t('permissions.editPermission')
                : t('permissions.createNewPermission')
            }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="closeModal"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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

        <form class="space-y-4" @submit.prevent="savePermission">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('roles.permissionName') }}</label
            >
            <input
              v-model="permissionForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('permissions.namePlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('permissions.permissionSlug') }}</label
            >
            <input
              v-model="permissionForm.slug"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('permissions.slugPlaceholder')"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('roles.module') }}</label
            >
            <select
              v-model="permissionForm.module"
              required
              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
            >
              <option value="">{{ t('permissions.selectModule') }}</option>
              <option value="users">{{ t('common.users') }}</option>
              <option value="roles">{{ t('common.roles') }}</option>
              <option value="permissions">{{ t('common.permissions') }}</option>
              <option value="dashboard">
                {{ t('permissions.dashboard') }}
              </option>
              <option value="analytics">
                {{ t('permissions.analytics') }}
              </option>
              <option value="settings">{{ t('common.settings') }}</option>
              <option value="report">{{ t('permissions.report') }}</option>
              <option value="weather">{{ t('permissions.weather') }}</option>
              <option value="data-ingestion">
                {{ t('permissions.dataIngestion') }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('auditLog.description') }}</label
            >
            <textarea
              v-model="permissionForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              :placeholder="t('permissions.descriptionPlaceholder')"
            ></textarea>
          </div>

          <div
            class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4"
          >
            <button
              type="button"
              :disabled="isSaving"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm w-full sm:w-auto bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="closeModal"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                v-if="isSaving"
                class="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>{{
                isSaving
                  ? t('roles.saving')
                  : editingPermission
                    ? t('permissions.updatePermission')
                    : t('permissions.createPermission')
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
      class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
        >
          <Trash2 class="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('permissions.deletePermission') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {{ t('permissions.deleteConfirmation') }}
            <span class="font-semibold">{{ deletingPermission?.name }}</span
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
              {{ t('permissions.deleteWarning') }}
            </p>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          @click="closeDeleteModal"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="deletePermission"
        >
          <Loader2 v-if="isDeleting" class="h-5 w-5 animate-spin" />
          <span>{{
            isDeleting ? t('roles.deleting') : t('permissions.deletePermission')
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
