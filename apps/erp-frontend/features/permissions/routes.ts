import type { RouteRecordRaw } from 'vue-router';
import PermissionsView from './views/PermissionsView.vue';

export const permissionRoutes: RouteRecordRaw[] = [
  {
    path: '/permissions',
    name: 'permissions',
    component: PermissionsView,
    meta: { requiresAuth: true },
  },
];
