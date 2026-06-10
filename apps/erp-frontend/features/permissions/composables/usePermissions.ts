import { ref, computed } from 'vue';
import { useFetchApi } from '@/composables/useFetchApi';
import type { PermissionListItem, PermissionStats } from '../types';

export function usePermissions() {
  const api = useFetchApi();
  const permissions = ref<PermissionListItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalPermissions = ref(0);
  const permissionStats = ref<PermissionStats>({
    total: 0,
    system: 0,
    user: 0,
    role: 0,
    permission: 0,
    unused: 0,
  });

  const totalPages = computed(() =>
    Math.ceil(totalPermissions.value / pageSize.value),
  );

  return {
    api,
    permissions,
    loading,
    error,
    currentPage,
    pageSize,
    totalPermissions,
    permissionStats,
    totalPages,
  };
}
