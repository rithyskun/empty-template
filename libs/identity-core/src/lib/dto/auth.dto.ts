export interface LoginDto {
  email: string;
  password: string;
  provider?: 'local' | 'ldap';
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    tenantId?: string;
    companyId?: string;
    branchId?: string;
  };
}
