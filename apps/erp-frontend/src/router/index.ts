import { createRouter, createWebHistory } from 'vue-router';
import BaseLayout from '@features/layout/components/BaseLayout.vue';
import { authRoutes } from '@features/auth/routes';
import { landingRoutes } from '@features/landing/routes';
import { dashboardRoutes } from '@features/dashboard/routes';
import { userRoutes } from '@features/users/routes';
import { roleRoutes } from '@features/roles/routes';
import { permissionRoutes } from '@features/permissions/routes';
import { advanceRoutes } from '@features/advances/routes';
import { settlementRoutes } from '@features/settlements/routes';
import { workflowRoutes } from '@features/workflows/routes';
import { administrationRoutes } from '@features/administration/routes';
import { profileRoutes } from '@features/profile/routes';

function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

function getStoredUser(): { roles?: string[]; permissions?: string[] } | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { roles?: string[]; permissions?: string[] };
  } catch {
    return null;
  }
}

function canAccess(
  requiredRoles?: string[],
  requiredPermissions?: string[],
): boolean {
  const user = getStoredUser();
  if (!user) return false;

  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];

  const isSuperAdmin =
    roles.includes('SUPER_ADMIN') || permissions.includes('all:all');
  if (isSuperAdmin) return true;

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => roles.includes(r));
    if (!hasRole) return false;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPerm = requiredPermissions.some((p) => permissions.includes(p));
    if (!hasPerm) return false;
  }

  return true;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes (no layout)
    ...authRoutes,
    // Authenticated routes wrapped in BaseLayout
    {
      path: '/',
      component: BaseLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        ...landingRoutes,
        ...dashboardRoutes,
        ...userRoutes,
        ...roleRoutes,
        ...permissionRoutes,
        ...advanceRoutes,
        ...settlementRoutes,
        ...workflowRoutes,
        ...administrationRoutes,
        ...profileRoutes,
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' };
  }
  if (to.meta.guestOnly && isAuthenticated()) {
    return { name: 'dashboard' };
  }

  const requiredRoles = to.meta.requiresRoles as string[] | undefined;
  const requiredPermissions = to.meta.requiresPermissions as
    | string[]
    | undefined;

  if (
    (requiredRoles && requiredRoles.length > 0) ||
    (requiredPermissions && requiredPermissions.length > 0)
  ) {
    if (!canAccess(requiredRoles, requiredPermissions)) {
      return { name: 'dashboard' };
    }
  }
});

export default router;
