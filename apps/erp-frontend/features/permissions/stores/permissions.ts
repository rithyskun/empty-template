import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PermissionListItem } from '../types';

export const usePermissionsStore = defineStore('permissions', () => {
  const selectedPermission = ref<PermissionListItem | null>(null);

  function setSelectedPermission(permission: PermissionListItem | null) {
    selectedPermission.value = permission;
  }

  return {
    selectedPermission,
    setSelectedPermission,
  };
});
