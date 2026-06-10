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
});

export default router;
