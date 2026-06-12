export interface CreateRoleDto {
  name: string;
  code: string;
  slug?: string;
  description?: string;
  tenantId?: string;
  isSystem?: boolean;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  code?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface RoleResponseDto {
  id: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  tenantId?: string;
  permissions: { id: string; name?: string; slug: string }[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleStatsDto {
  total: number;
  active: number;
  inactive: number;
  withPermissions: number;
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}
