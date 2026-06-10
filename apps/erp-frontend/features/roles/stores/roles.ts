import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RoleListItem } from '../types';

export const useRolesStore = defineStore('roles', () => {
  const selectedRole = ref<RoleListItem | null>(null);

  function setSelectedRole(role: RoleListItem | null) {
    selectedRole.value = role;
  }

  return {
    selectedRole,
    setSelectedRole,
  };
});
