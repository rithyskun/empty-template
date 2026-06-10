export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
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
