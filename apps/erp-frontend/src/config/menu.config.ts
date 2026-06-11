import type { Component } from 'vue';
import { Home } from 'lucide-vue-next';

export interface MenuItem {
  label: string;
  path: string;
  icon?: Component;
  badge?: string | number;
  children?: MenuItem[];
  /** Permission strings required to see this item (any of them). Example: ['users:read'] */
  permissions?: string[];
  /** Role strings required to see this item (any of them). Example: ['SUPER_ADMIN'] */
  roles?: string[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuSections: MenuSection[] = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: Home,
      },
    ],
  },
];

/**
 * Filter menu sections based on current user permissions and roles.
 * Supports super-admin bypass via 'all:all' or 'SUPER_ADMIN' role.
 */
export function filterMenuSections(
  sections: MenuSection[],
  userPermissions: string[],
  userRoles: string[],
): MenuSection[] {
  const isSuperAdmin =
    userRoles.includes('SUPER_ADMIN') || userPermissions.includes('all:all');

  function itemVisible(item: MenuItem): boolean {
    if (isSuperAdmin) return true;

    if (item.roles && item.roles.length > 0) {
      const hasRole = item.roles.some((r) => userRoles.includes(r));
      if (!hasRole) return false;
    }

    if (item.permissions && item.permissions.length > 0) {
      const hasPerm = item.permissions.some((p) => userPermissions.includes(p));
      if (!hasPerm) return false;
    }

    if (item.children) {
      item.children = item.children.filter(itemVisible);
      return item.children.length > 0;
    }

    return true;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(itemVisible),
    }))
    .filter((section) => section.items.length > 0);
}
