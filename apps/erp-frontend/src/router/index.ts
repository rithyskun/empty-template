import { createRouter, createWebHistory } from 'vue-router';
import { authRoutes } from '@features/auth/routes';
import { dashboardRoutes } from '@features/dashboard/routes';
import { userRoutes } from '@features/users/routes';
import { roleRoutes } from '@features/roles/routes';
import { permissionRoutes } from '@features/permissions/routes';

function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...dashboardRoutes,
    ...authRoutes,
    ...userRoutes,
    ...roleRoutes,
    ...permissionRoutes,
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' };
  }
  if (to.meta.guestOnly && isAuthenticated()) {
    return { name: 'home' };
  }
});

export default router;
