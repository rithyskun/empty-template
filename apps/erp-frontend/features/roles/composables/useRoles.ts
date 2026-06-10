import { ref, computed } from 'vue';
import { useFetchApi } from '@/composables/useFetchApi';
import type { RoleListItem, RoleStats } from '../types';

export function useRoles() {
  const api = useFetchApi();
  const roles = ref<RoleListItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalRoles = ref(0);
  const roleStats = ref<RoleStats>({
    totalRoles: 0,
    activeRoles: 0,
    inactiveRoles: 0,
    totalPermissions: 0,
  });

  const totalPages = computed(() =>
    Math.ceil(totalRoles.value / pageSize.value),
  );

  return {
    api,
    roles,
    loading,
    error,
    currentPage,
    pageSize,
    totalRoles,
    roleStats,
    totalPages,
  };
}
