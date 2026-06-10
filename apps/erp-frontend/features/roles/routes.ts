import type { RouteRecordRaw } from 'vue-router';
import RolesView from './views/RolesView.vue';

export const roleRoutes: RouteRecordRaw[] = [
  {
    path: '/roles',
    name: 'roles',
    component: RolesView,
    meta: { requiresAuth: true },
  },
];
