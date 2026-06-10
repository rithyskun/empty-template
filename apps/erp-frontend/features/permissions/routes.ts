import type { RouteRecordRaw } from 'vue-router';
import PermissionsView from './views/PermissionsView.vue';
import { administrationSidebar } from '@features/administration/config/sidebar.config';

export const permissionRoutes: RouteRecordRaw[] = [
  {
    path: '/administration/permissions',
    name: 'permissions',
    component: PermissionsView,
    meta: {
      requiresAuth: true,
      sidebarSections: administrationSidebar,
      breadcrumb: 'Permissions',
    },
  },
];
