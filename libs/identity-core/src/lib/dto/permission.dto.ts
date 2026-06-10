export interface CreatePermissionDto {
  roleId: string;
  resource: string;
  action: string;
  tenantId?: string;
}

export interface UpdatePermissionDto {
  resource?: string;
  action?: string;
}

export interface PermissionResponseDto {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionDto {
  resource: string;
  action: string;
}

export interface SetRolePermissionsDto {
  roleId: string;
  permissions: RolePermissionDto[];
}
