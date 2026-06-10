<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  Users,
  Clock,
  Mail,
  MailCheck,
  Ban,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  X,
} from 'lucide-vue-next';
import { useFetchApi } from '@/composables/useFetchApi';
import { useToast } from '@/composables/useToast';
import type { ApiUser } from '@/composables/useAuth';
import type { UserListItem } from '../types';

// Props for detail view
defineProps<{
  id?: string;
}>();

const api = useFetchApi();
const toast = useToast();
const searchQuery = ref('');
const users = ref<UserListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);

// Stats from API
const userStats = ref({
  total: 0,
  active: 0,
  inactive: 0,
  pending: 0,
  suspended: 0,
  locked: 0,
});

// Filters
const statusFilter = ref('');

// Modal state
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingUser = ref<UserListItem | null>(null);
const isSaving = ref(false);
const formError = ref<string | null>(null);

// Confirmation modal state
const showSuspendModal = ref(false);
const showDeactivateModal = ref(false);
const showDeleteModal = ref(false);
const showResetPasswordModal = ref(false);
const selectedUserForAction = ref<UserListItem | null>(null);
const isProcessingAction = ref(false);
const actionError = ref<string | null>(null);

// Reset password form
const resetPasswordForm = ref({
  newPassword: '',
  confirmPassword: '',
});

// Form data
const userForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  avatar: '',
  roleId: '',
  status: 'active',
});

// Role descriptions for modal
const roleDescriptions: Record<string, string> = {
  'super-admin': 'Full system access with all permissions',
  admin: 'Administrative access without system-level permissions',
  'data-manager': 'Manage data ingestion, collection, and weather data',
  analyst: 'View and analyze data, create reports',
  operator: 'Upload files and monitor processing',
  viewer: 'Read-only access to data and reports',
};

const getSelectedRoleDescription = computed(() => {
  if (!Array.isArray(availableRoles.value) || !userForm.value.roleId) {
    return '';
  }
  const selectedRole = availableRoles.value.find(
    (r) => r.id === userForm.value.roleId,
  );
  if (selectedRole && selectedRole.slug) {
    return roleDescriptions[selectedRole.slug] || '';
  }
  return '';
});

// Available roles
const availableRoles = ref<Array<{ id: string; name: string; slug?: string }>>(
  [],
);

// Helper functions
const getRoleColor = (roleSlug: string): string => {
  const colors: Record<string, string> = {
    'super-admin': 'red',
    admin: 'orange',
    'data-manager': 'blue',
    analyst: 'purple',
    operator: 'green',
    viewer: 'gray',
  };
  return colors[roleSlug] || 'gray';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'red',
    pending: 'yellow',
    suspended: 'orange',
  };
  return colors[status.toLowerCase()] || 'gray';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const transformApiUser = (apiUser: ApiUser): UserListItem => {
  const status = apiUser.status ?? '';
  return {
    id: apiUser.id,
    name: `${apiUser.firstName} ${apiUser.lastName}`,
    email: apiUser.email,
    avatar:
      apiUser.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(apiUser.firstName + ' ' + apiUser.lastName)}&background=3b82f6&color=fff`,
    role: apiUser.role?.name ?? '',
    roleId: apiUser.roleId ?? '',
    roleSlug: apiUser.role?.slug ?? '',
    roleColor: getRoleColor(apiUser.role?.slug ?? ''),
    status: status.charAt(0).toUpperCase() + status.slice(1),
    statusColor: getStatusColor(status),
    joinedDate: formatDate(apiUser.createdAt ?? ''),
    phone: apiUser.phone ?? null,
    isEmailVerified: !!apiUser.isEmailVerified,
    lastLogin: apiUser.lastLoginAt ? formatDate(apiUser.lastLoginAt) : null,
    loginAttempts: apiUser.loginAttempts || 0,
    lockoutUntil: apiUser.lockoutUntil ?? null,
  };
};

// Fetch users from API
const fetchUsers = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await api.fetchApi<{ data: ApiUser[]; total: number }>(
      '/users',
      {
        params: {
          page: currentPage.value,
          limit: pageSize.value,
        },
      },
    );

    users.value = response.data.data.map(transformApiUser);
    totalUsers.value = response.data.total;
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to fetch users';
    console.error('Error fetching users:', err);
  } finally {
    isLoading.value = false;
  }
};

// Pagination computed
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value));

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchUsers();
  }
};

// Fetch user stats from API
const fetchUserStats = async () => {
  try {
    const response = await api.fetchApi<{
      total: number;
      active: number;
      inactive: number;
      pending: number;
      suspended: number;
      locked: number;
    }>('/users/stats');

    userStats.value = response.data;
  } catch (err: any) {
    console.error('Error fetching user stats:', err);
  }
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) {
    return users.value;
  }

  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query),
  );
});

// Fetch available roles
const fetchRoles = async () => {
  try {
    const response =
      await api.fetchApi<Array<{ id: string; name: string; slug: string }>>(
        '/roles/active',
      );
    availableRoles.value = response.data;
  } catch (err: any) {
    console.error('Error fetching roles:', err);
  }
};

// Edit user
const editUser = (user: UserListItem) => {
  editingUser.value = user;
  userForm.value = {
    firstName: user.name.split(' ')[0] || '',
    lastName: user.name.split(' ').slice(1).join(' ') || '',
    email: user.email,
    password: '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    roleId: user.roleId || '',
    status: user.status.toLowerCase(),
  };
  showEditModal.value = true;
};

// Activate user
const activateUser = async (user: UserListItem) => {
  try {
    await api.postApi(`/users/${user.id}/activate`, {});
    user.status = 'Active';
    user.statusColor = getStatusColor('active');
    await fetchUserStats();
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to activate user';
    setTimeout(() => {
      error.value = null;
    }, 5000);
  }
};

// Show deactivate confirmation modal
const showDeactivateConfirmation = (user: UserListItem) => {
  selectedUserForAction.value = user;
  showDeactivateModal.value = true;
};

// Deactivate user
const deactivateUser = async () => {
  if (!selectedUserForAction.value) return;

  isProcessingAction.value = true;
  actionError.value = null;
  try {
    await api.postApi(
      `/users/${selectedUserForAction.value.id}/deactivate`,
      {},
    );
    selectedUserForAction.value.status = 'Inactive';
    selectedUserForAction.value.statusColor = getStatusColor('inactive');
    showDeactivateModal.value = false;
    selectedUserForAction.value = null;
    await fetchUserStats();
  } catch (err) {
    actionError.value = (err as Error)?.message || 'Failed to deactivate user';
  } finally {
    isProcessingAction.value = false;
  }
};

// Show suspend confirmation modal
const showSuspendConfirmation = (user: UserListItem) => {
  selectedUserForAction.value = user;
  showSuspendModal.value = true;
};

// Suspend user
const suspendUser = async () => {
  if (!selectedUserForAction.value) return;

  isProcessingAction.value = true;
  actionError.value = null;
  try {
    await api.postApi(`/users/${selectedUserForAction.value.id}/suspend`, {});
    selectedUserForAction.value.status = 'Suspended';
    selectedUserForAction.value.statusColor = getStatusColor('suspended');
    showSuspendModal.value = false;
    selectedUserForAction.value = null;
    await fetchUserStats();
  } catch (err) {
    actionError.value = (err as Error)?.message || 'Failed to suspend user';
  } finally {
    isProcessingAction.value = false;
  }
};

// Show delete confirmation modal
const showDeleteConfirmation = (user: UserListItem) => {
  selectedUserForAction.value = user;
  showDeleteModal.value = true;
};

// Delete user
const deleteUser = async () => {
  if (!selectedUserForAction.value) return;

  isProcessingAction.value = true;
  actionError.value = null;
  try {
    await api.deleteApi(`/users/${selectedUserForAction.value.id}`);
    showDeleteModal.value = false;
    selectedUserForAction.value = null;
    await fetchUsers();
    await fetchUserStats();
  } catch (err) {
    actionError.value = (err as Error)?.message || 'Failed to delete user';
  } finally {
    isProcessingAction.value = false;
  }
};

// Show reset password modal
const showResetPasswordConfirmation = (user: UserListItem) => {
  selectedUserForAction.value = user;
  resetPasswordForm.value = { newPassword: '', confirmPassword: '' };
  actionError.value = null;
  showResetPasswordModal.value = true;
};

// Reset user password
const resetUserPassword = async () => {
  if (!selectedUserForAction.value) return;
  if (
    resetPasswordForm.value.newPassword !==
    resetPasswordForm.value.confirmPassword
  ) {
    actionError.value = 'Passwords do not match';
    return;
  }
  isProcessingAction.value = true;
  actionError.value = null;
  const userName = selectedUserForAction.value.name;
  try {
    await api.postApi(
      `/users/${selectedUserForAction.value.id}/reset-password`,
      {
        newPassword: resetPasswordForm.value.newPassword,
        confirmPassword: resetPasswordForm.value.confirmPassword,
      },
    );
    showResetPasswordModal.value = false;
    selectedUserForAction.value = null;
    resetPasswordForm.value = { newPassword: '', confirmPassword: '' };
    toast.success(`Password for ${userName} has been reset successfully.`);
  } catch (err) {
    actionError.value = (err as Error)?.message || 'Failed to reset password';
    toast.error(`Failed to reset password for ${userName}.`);
  } finally {
    isProcessingAction.value = false;
  }
};

// Close confirmation modals
const closeConfirmationModal = () => {
  showSuspendModal.value = false;
  showDeactivateModal.value = false;
  showDeleteModal.value = false;
  showResetPasswordModal.value = false;
  selectedUserForAction.value = null;
  isProcessingAction.value = false;
  actionError.value = null;
  resetPasswordForm.value = { newPassword: '', confirmPassword: '' };
};

// Save user (create or update)
const saveUser = async () => {
  isSaving.value = true;
  formError.value = null;

  // Validate roleId
  if (!userForm.value.roleId) {
    formError.value = 'Please select a role';
    isSaving.value = false;
    return;
  }

  try {
    if (editingUser.value) {
      // Update existing user
      await api.putApi(`/users/${editingUser.value.id}`, {
        firstName: userForm.value.firstName,
        lastName: userForm.value.lastName,
        email: userForm.value.email,
        phone: userForm.value.phone || null,
        avatar: userForm.value.avatar || null,
        roleId: userForm.value.roleId,
        status: userForm.value.status,
      });
    } else {
      // Create new user
      await api.postApi('/users', {
        firstName: userForm.value.firstName,
        lastName: userForm.value.lastName,
        email: userForm.value.email,
        password: userForm.value.password,
        phone: userForm.value.phone || null,
        avatar: userForm.value.avatar || null,
        roleId: userForm.value.roleId,
        status: userForm.value.status,
      });
    }

    await fetchUsers();
    await fetchUserStats();
    closeModal();
  } catch (err: any) {
    formError.value = err?.message || 'Failed to save user';
  } finally {
    isSaving.value = false;
  }
};

// Close modal
const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingUser.value = null;
  formError.value = null;
  userForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    avatar: '',
    roleId: '',
    status: 'active',
  };
};

// Load users on mount
onMounted(() => {
  fetchUsers();
  fetchRoles();
  fetchUserStats();
});
</script>

<template>
  <div>
    <!-- Page title -->
    <div class="mb-6 sm:mb-8">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {{ $t('users.title') }}
          </h1>
          <p
            class="text-gray-600 dark:text-dark-text-secondary mt-1 text-sm sm:text-base"
          >
            {{ $t('users.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
          @click="showCreateModal = true"
        >
          <UserPlus class="h-5 w-5" />
          <span>{{ $t('users.addUser') }}</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users
              class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.totalUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.total }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <UserCheck
              class="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.activeUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.active }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <UserX
              class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.inactiveUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.inactive }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Clock
              class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.pendingUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.pending }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Ban
              class="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.suspendedUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.suspended }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-center">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Shield
              class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400"
            />
          </div>
          <div class="ml-3">
            <p
              class="text-xs font-medium text-gray-600 dark:text-dark-text-secondary"
            >
              {{ $t('users.lockedUsers') }}
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ userStats.locked }}
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
            :placeholder="$t('users.searchUsers')"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option value="">{{ $t('users.allStatus') }}</option>
          <option value="active">{{ $t('users.activeUsers') }}</option>
          <option value="inactive">{{ $t('users.inactiveUsers') }}</option>
          <option value="pending">{{ $t('users.pendingUsers') }}</option>
          <option value="suspended">{{ $t('users.suspendedUsers') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
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
        @click="fetchUsers()"
      >
        {{ $t('roles.tryAgain') }}
      </button>
    </div>

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
                {{ $t('users.user') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ $t('users.email') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ $t('users.role') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ $t('users.status') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
              >
                {{ $t('users.joinedDate') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ $t('users.actions') }}
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border"
          >
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-dark-bg-hover"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img
                    :src="user.avatar"
                    :alt="user.name"
                    class="h-10 w-10 rounded-full"
                  />
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ user.name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div
                    class="text-sm text-gray-900 dark:text-dark-text-tertiary"
                  >
                    {{ user.email }}
                  </div>
                  <MailCheck
                    v-if="user.isEmailVerified"
                    class="h-5 w-5 text-green-600 dark:text-green-400"
                    title="Email Verified"
                  />
                  <Mail
                    v-else
                    class="h-5 w-5 text-gray-400"
                    title="Email Not Verified"
                  />
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${user.roleColor}-100 text-${user.roleColor}-800`"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${user.statusColor}-100 text-${user.statusColor}-800`"
                >
                  {{ user.status }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-tertiary"
              >
                {{ user.joinedDate }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <div class="flex justify-end space-x-1">
                  <button
                    v-if="user.status !== 'Active'"
                    type="button"
                    class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1"
                    title="Activate"
                    @click="activateUser(user)"
                  >
                    <UserCheck class="h-5 w-5" />
                  </button>
                  <button
                    v-if="user.status === 'Active'"
                    type="button"
                    class="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1"
                    title="Deactivate"
                    @click="showDeactivateConfirmation(user)"
                  >
                    <UserX class="h-5 w-5" />
                  </button>
                  <button
                    v-if="user.status === 'Active'"
                    type="button"
                    class="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-1"
                    title="Suspend"
                    @click="showSuspendConfirmation(user)"
                  >
                    <Ban class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1"
                    :title="$t('users.resetPassword')"
                    @click="showResetPasswordConfirmation(user)"
                  >
                    <KeyRound class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 p-1"
                    title="Edit"
                    @click="editUser(user)"
                  >
                    <Edit class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                    title="Delete"
                    @click="showDeleteConfirmation(user)"
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
    <div v-if="!isLoading && !error" class="lg:hidden space-y-4">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 transition-colors duration-200"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center min-w-0 flex-1">
            <div class="flex-shrink-0 h-10 w-10 mr-3">
              <img
                :src="user.avatar"
                :alt="user.name"
                class="h-10 w-10 rounded-full"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1">
                <h3
                  class="text-sm font-medium text-gray-900 dark:text-white truncate"
                >
                  {{ user.name }}
                </h3>
                <MailCheck
                  v-if="user.isEmailVerified"
                  class="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0"
                  title="Email Verified"
                />
              </div>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate"
              >
                {{ user.email }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              class="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
              :title="$t('users.resetPassword')"
              @click="showResetPasswordConfirmation(user)"
            >
              <KeyRound class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
              title="Edit"
              @click="editUser(user)"
            >
              <Edit class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete"
              @click="showDeleteConfirmation(user)"
            >
              <Trash2 class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p
              class="text-xs text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide"
            >
              {{ $t('users.role') }}
            </p>
            <span
              :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${user.roleColor}-100 text-${user.roleColor}-800`"
            >
              {{ user.role }}
            </span>
          </div>
          <div>
            <p
              class="text-xs text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide"
            >
              {{ $t('users.status') }}
            </p>
            <span
              :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${user.statusColor}-100 text-${user.statusColor}-800`"
            >
              {{ user.status }}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <p class="text-xs text-gray-500 dark:text-dark-text-tertiary">
            {{ $t('users.joined') }} {{ user.joinedDate }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="!isLoading && !error"
      class="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-dark-border gap-4"
    >
      <div
        class="text-sm text-gray-700 dark:text-dark-text-secondary text-center sm:text-left"
      >
        {{ $t('roles.showing') }}
        <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
        {{ $t('roles.to') }}
        <span class="font-medium">{{
          Math.min(currentPage * pageSize, totalUsers)
        }}</span>
        {{ $t('roles.of') }} <span class="font-medium">{{ totalUsers }}</span>
        {{ $t('roles.results') }}
      </div>
      <div class="flex space-x-2 w-full sm:w-auto justify-center">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-dark-bg-secondary"
          @click="goToPage(currentPage - 1)"
        >
          {{ $t('users.previous') }}
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          class="px-3 py-2 rounded-lg text-sm font-medium"
          :class="[
            currentPage === page
              ? 'bg-primary-600 text-white'
              : 'border border-gray-300 dark:border-dark-border-light text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover bg-white dark:bg-dark-bg-secondary',
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-dark-bg-secondary"
          @click="goToPage(currentPage + 1)"
        >
          {{ $t('users.next') }}
        </button>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click.self="closeModal()"
    >
      <div
        class="relative top-4 sm:top-20 mx-auto p-4 sm:p-6 border border-gray-200 dark:border-dark-border-light w-full max-w-2xl shadow-lg rounded-lg bg-white dark:bg-dark-bg-secondary m-4 transition-colors duration-200"
      >
        <div class="mt-3">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{
                  editingUser ? $t('users.editUser') : $t('users.createNewUser')
                }}
              </h3>
              <p
                class="text-sm text-gray-500 dark:text-dark-text-tertiary mt-1"
              >
                {{
                  editingUser
                    ? $t('users.updateUserInfo')
                    : $t('users.addNewTeamMember')
                }}
              </p>
            </div>
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

          <form class="space-y-4" @submit.prevent="saveUser()">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.firstName') }}</label
                >
                <input
                  v-model="userForm.firstName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  :placeholder="$t('users.enterFirstName')"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.lastName') }}</label
                >
                <input
                  v-model="userForm.lastName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  :placeholder="$t('users.enterLastName')"
                />
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                >{{ $t('users.email') }}</label
              >
              <input
                v-model="userForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                :placeholder="$t('users.enterEmail')"
              />
            </div>

            <div v-if="!editingUser">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                >{{ $t('users.password') }} *</label
              >
              <input
                v-model="userForm.password"
                type="password"
                :required="!editingUser"
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                :placeholder="$t('users.enterPassword')"
                minlength="8"
              />
              <p
                class="mt-1 text-xs text-gray-500 dark:text-dark-text-tertiary"
              >
                {{ $t('users.passwordRequirements') }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.phone') }} ({{ $t('users.optional') }})</label
                >
                <input
                  v-model="userForm.phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.status') }} *</label
                >
                <select
                  v-model="userForm.status"
                  required
                  class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  <option value="active">{{ $t('common.active') }}</option>
                  <option value="inactive">{{ $t('common.inactive') }}</option>
                  <option value="pending">{{ $t('users.pending') }}</option>
                  <option value="suspended">{{ $t('users.suspended') }}</option>
                </select>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                >{{ $t('users.avatarUrl') }} ({{ $t('users.optional') }})</label
              >
              <input
                v-model="userForm.avatar"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/avatar.jpg"
              />
              <p
                class="mt-1 text-xs text-gray-500 dark:text-dark-text-tertiary"
              >
                {{ $t('users.avatarHint') }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                >{{ $t('users.role') }} *</label
              >
              <select
                v-model="userForm.roleId"
                required
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="">{{ $t('users.selectRole') }}</option>
                <option
                  v-for="role in availableRoles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </option>
              </select>
              <div
                v-if="getSelectedRoleDescription"
                class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div class="flex items-start gap-2">
                  <Shield
                    class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                  />
                  <p class="text-xs text-blue-800 dark:text-blue-300">
                    {{ getSelectedRoleDescription }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-dark-border"
            >
              <button
                type="button"
                :disabled="isSaving"
                class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm w-full sm:w-auto bg-white dark:bg-dark-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                @click="closeModal()"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isSaving" class="animate-spin h-5 w-5" />
                <span>{{
                  isSaving
                    ? $t('roles.saving')
                    : editingUser
                      ? $t('users.updateUser')
                      : $t('users.createUser')
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Suspend Confirmation Modal -->
    <div
      v-if="showSuspendModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmationModal()"
    >
      <div
        class="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-border"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
          >
            <Ban class="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div class="flex-1">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              {{ $t('users.suspendUser') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              {{ $t('users.suspendConfirmation') }}
              <span class="font-semibold">{{
                selectedUserForAction?.name
              }}</span
              >?
            </p>
            <div
              class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4"
            >
              <p class="text-xs text-orange-800 dark:text-orange-300">
                <strong>{{ $t('users.warning') }}:</strong>
                {{ $t('users.suspendWarning') }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="closeConfirmationModal()"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="suspendUser()"
          >
            <Loader2 v-if="isProcessingAction" class="h-5 w-5 animate-spin" />
            <span>{{
              isProcessingAction
                ? $t('users.suspending')
                : $t('users.suspendUser')
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div
      v-if="showDeactivateModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmationModal()"
    >
      <div
        class="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-border"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"
          >
            <UserX class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="flex-1">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              {{ $t('users.deactivateUser') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              {{ $t('users.deactivateConfirmation') }}
              <span class="font-semibold">{{
                selectedUserForAction?.name
              }}</span
              >?
            </p>
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4"
            >
              <p class="text-xs text-yellow-800 dark:text-yellow-300">
                <strong>{{ $t('users.note') }}:</strong>
                {{ $t('users.deactivateWarning') }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="closeConfirmationModal()"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="deactivateUser()"
          >
            <Loader2 v-if="isProcessingAction" class="h-5 w-5 animate-spin" />
            <span>{{
              isProcessingAction
                ? $t('users.deactivating')
                : $t('users.deactivateUser')
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div
      v-if="showResetPasswordModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmationModal()"
    >
      <div
        class="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-border"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
          >
            <KeyRound class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div class="flex-1">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-1"
            >
              {{ $t('users.resetPassword') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              {{ $t('users.resetPasswordFor') }}
              <span class="font-semibold">{{
                selectedUserForAction?.name
              }}</span>
            </p>

            <!-- Error -->
            <div
              v-if="actionError"
              class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p class="text-sm text-red-800 dark:text-red-300">
                {{ actionError }}
              </p>
            </div>

            <div class="space-y-3">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.newPassword') }}</label
                >
                <input
                  v-model="resetPasswordForm.newPassword"
                  type="password"
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  :placeholder="$t('users.enterNewPassword')"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
                  >{{ $t('users.confirmNewPassword') }}</label
                >
                <input
                  v-model="resetPasswordForm.confirmPassword"
                  type="password"
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  :placeholder="$t('users.confirmNewPasswordPlaceholder')"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-dark-text-tertiary">
                {{ $t('users.passwordRequirements') }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="closeConfirmationModal()"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="
              isProcessingAction ||
              !resetPasswordForm.newPassword ||
              !resetPasswordForm.confirmPassword
            "
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="resetUserPassword()"
          >
            <Loader2 v-if="isProcessingAction" class="h-5 w-5 animate-spin" />
            <span>{{
              isProcessingAction
                ? $t('users.resettingPassword')
                : $t('users.resetPassword')
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900/80 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmationModal()"
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
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              {{ $t('users.deleteUser') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              {{ $t('users.deleteConfirmation') }}
              <span class="font-semibold">{{
                selectedUserForAction?.name
              }}</span
              >?
            </p>
            <div
              v-if="actionError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4"
            >
              <p class="text-sm text-red-800 dark:text-red-300">
                {{ actionError }}
              </p>
            </div>
            <div
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4"
            >
              <p class="text-xs text-red-800 dark:text-red-300">
                <strong>{{ $t('roles.danger') }}:</strong>
                {{ $t('users.deleteWarning') }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="closeConfirmationModal()"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="isProcessingAction"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="deleteUser()"
          >
            <Loader2 v-if="isProcessingAction" class="h-5 w-5 animate-spin" />
            <span>{{
              isProcessingAction ? $t('roles.deleting') : $t('users.deleteUser')
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
