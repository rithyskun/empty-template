export interface CreatePermissionDto {
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
  tenantId?: string;
  isSystem?: boolean;
}

export interface UpdatePermissionDto {
  name?: string;
  slug?: string;
  module?: string;
  action?: string;
  description?: string;
}

export interface PermissionResponseDto {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
  isSystem: boolean;
  tenantId?: string;
  rolesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetRolePermissionsDto {
  roleId: string;
  permissionIds: string[];
}

export interface PermissionStatsDto {
  total: number;
  system: number;
  user: number;
  role: number;
  permission: number;
  unused: number;
}

export interface PermissionUsageDto {
  permission: PermissionResponseDto;
  roleCount: number;
}
