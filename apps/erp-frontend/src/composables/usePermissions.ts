import { computed } from 'vue';
import { useAuth } from '@features/auth/composables/useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const permissions = computed(() => user.value?.permissions ?? []);
  const roles = computed(() => user.value?.roles ?? []);

  const isSuperAdmin = computed(
    () =>
      roles.value.includes('SUPER_ADMIN') ||
      permissions.value.includes('all:all'),
  );

  /**
   * Check if the user has a specific permission (e.g. 'users:read').
   * Super-admin bypass is supported.
   */
  function can(permission: string): boolean {
    if (isSuperAdmin.value) return true;
    return permissions.value.includes(permission);
  }

  /**
   * Check if the user has ANY of the provided permissions.
   */
  function canAny(...required: string[]): boolean {
    if (isSuperAdmin.value) return true;
    if (required.length === 0) return true;
    return required.some((p) => permissions.value.includes(p));
  }

  /**
   * Check if the user has ALL of the provided permissions.
   */
  function canAll(...required: string[]): boolean {
    if (isSuperAdmin.value) return true;
    if (required.length === 0) return true;
    return required.every((p) => permissions.value.includes(p));
  }

  /**
   * Check if the user has a specific role.
   * Super-admin bypass is supported.
   */
  function hasRole(role: string): boolean {
    if (isSuperAdmin.value) return true;
    return roles.value.includes(role);
  }

  /**
   * Check if the user has ANY of the provided roles.
   */
  function hasAnyRole(...required: string[]): boolean {
    if (isSuperAdmin.value) return true;
    if (required.length === 0) return true;
    return required.some((r) => roles.value.includes(r));
  }

  return {
    permissions,
    roles,
    isSuperAdmin,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
  };
}
