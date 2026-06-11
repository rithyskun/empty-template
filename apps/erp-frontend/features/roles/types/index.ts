import type { Permission } from '@features/auth/types';

export interface RoleListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissionSlugs: string[];
  permissionIds: string[];
  permissionObjects: Permission[];
  status: string;
  userCount: number;
  createdAt: string;
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalPermissions: number;
}

export interface RoleFormData {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}
