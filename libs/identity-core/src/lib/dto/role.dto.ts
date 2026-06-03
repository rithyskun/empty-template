export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string;
  tenantId?: string;
  isSystem?: boolean;
  permissions?: { resource: string; action: string }[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface RoleResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  tenantId?: string;
  permissions: { resource: string; action: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}
