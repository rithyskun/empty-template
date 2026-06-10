export interface UserListItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  roleId: string;
  roleSlug: string;
  roleColor: string;
  status: string;
  statusColor: string;
  joinedDate: string;
  phone: string | null;
  isEmailVerified: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  lockoutUntil: string | null;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  locked: number;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  avatar: string;
  roleId: string;
  status: string;
}
