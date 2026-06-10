import { ref, computed } from 'vue';

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module?: string;
  action?: string;
  isSystem?: boolean;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  isSystem?: boolean;
  userCount?: number;
  createdAt?: string;
  permissions?: Permission[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  role?: { name: string; slug: string };
  roleId?: string;
  roles: string[];
  permissions: string[];
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
  phone?: string;
  isEmailVerified?: boolean;
  loginAttempts?: number;
  lockoutUntil?: string;
}

export type ApiUser = User;

const user = ref<User | null>(null);

export function useAuth() {
  const hasPermission = (permission: string) => {
    void permission;
    return true;
  };
  const hasRole = (role: string) => {
    void role;
    return true;
  };

  return {
    user: computed(() => user.value),
    isAuthenticated: computed(() => !!user.value),
    logout: () => {
      user.value = null;
      localStorage.removeItem('accessToken');
    },
    hasPermission,
    hasRole,
  };
}
