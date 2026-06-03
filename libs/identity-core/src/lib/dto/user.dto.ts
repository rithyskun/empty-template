export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  branchId?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  lastLoginAt?: Date;
  roles: { id: string; name: string; code: string }[];
  createdAt: Date;
  updatedAt: Date;
}
