import type { RouteRecordRaw } from 'vue-router';
import RolesView from './views/RolesView.vue';
import { administrationSidebar } from '@features/administration/config/sidebar.config';

export const roleRoutes: RouteRecordRaw[] = [
  {
    path: '/administration/roles',
    name: 'roles',
    component: RolesView,
    meta: {
      requiresAuth: true,
      sidebarSections: administrationSidebar,
      breadcrumb: 'Roles',
    },
  },
];
