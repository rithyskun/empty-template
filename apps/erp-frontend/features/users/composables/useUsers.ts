import { ref, computed } from 'vue';
import { useFetchApi } from '@/composables/useFetchApi';
import type { UserListItem, UserStats } from '../types';

export function useUsers() {
  const api = useFetchApi();
  const users = ref<UserListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalUsers = ref(0);
  const userStats = ref<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    suspended: 0,
    locked: 0,
  });

  const totalPages = computed(() =>
    Math.ceil(totalUsers.value / pageSize.value),
  );

  return {
    api,
    users,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalUsers,
    userStats,
    totalPages,
  };
}
