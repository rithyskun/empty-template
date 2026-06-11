import type { DirectiveBinding, ObjectDirective } from 'vue';

function getStoredUser(): { roles?: string[]; permissions?: string[] } | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function checkAccess(permissions?: string[], roles?: string[]): boolean {
  const user = getStoredUser();
  if (!user) return false;

  const userRoles = user.roles ?? [];
  const userPermissions = user.permissions ?? [];

  const isSuperAdmin =
    userRoles.includes('SUPER_ADMIN') || userPermissions.includes('all:all');
  if (isSuperAdmin) return true;

  if (roles && roles.length > 0) {
    if (!roles.some((r) => userRoles.includes(r))) return false;
  }

  if (permissions && permissions.length > 0) {
    if (!permissions.some((p) => userPermissions.includes(p))) return false;
  }

  return true;
}

interface CanBindingValue {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
}

export const vCan: ObjectDirective<HTMLElement, CanBindingValue> = {
  mounted(el, binding: DirectiveBinding<CanBindingValue>) {
    const value = binding.value;
    if (!value) return;

    const permissions = value.permission
      ? [value.permission]
      : (value.permissions ?? []);
    const roles = value.role ? [value.role] : (value.roles ?? []);

    if (!checkAccess(permissions, roles)) {
      el.style.display = 'none';
    }
  },
  updated(el, binding: DirectiveBinding<CanBindingValue>) {
    const value = binding.value;
    if (!value) return;

    const permissions = value.permission
      ? [value.permission]
      : (value.permissions ?? []);
    const roles = value.role ? [value.role] : (value.roles ?? []);

    if (checkAccess(permissions, roles)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  },
};
