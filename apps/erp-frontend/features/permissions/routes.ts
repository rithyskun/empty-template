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
      requiresRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      sidebarSections: administrationSidebar,
      breadcrumb: 'Permissions',
    },
  },
];
