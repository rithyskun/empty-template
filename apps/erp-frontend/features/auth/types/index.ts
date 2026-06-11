export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  lastLoginAt?: string;
  isTwoFactorEnabled?: boolean;
}

export type AuthProvider = 'local' | 'ldap';

export interface LoginCredentials {
  email: string;
  password: string;
  provider: AuthProvider;
}

export interface TwoFactorCredentials {
  code: string;
  method: 'totp' | 'sms' | 'email';
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
  requires2fa?: boolean;
  tempToken?: string;
  statusCode?: number;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  twoFactorMethods: Array<'totp' | 'sms' | 'email'>;
  tempToken: string | null;
  pendingApproval: boolean;
}

// Permission type used by permissions and roles views
export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
  createdAt?: string;
}

// Role type used by roles view
export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  userCount?: number;
  createdAt?: string;
  permissions?: Permission[];
}

// ApiUser type used by users view
export interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role?: { name: string; slug: string };
  roleId?: string;
  status?: string;
  createdAt?: string;
  phone?: string;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  loginAttempts?: number;
  lockoutUntil?: string | null;
}
