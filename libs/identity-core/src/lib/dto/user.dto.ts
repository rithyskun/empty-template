import { UserStatus } from '@erp/enums';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  isActive?: boolean;
  status?: UserStatus;
  roleId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  status?: UserStatus;
  branchId?: string;
  roleId?: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  status: UserStatus;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  lastLoginAt?: Date;
  roleId?: string;
  role?: { id: string; name: string; code: string; slug?: string };
  roles: { id: string; name: string; code: string; slug?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStatsDto {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  locked: number;
}
