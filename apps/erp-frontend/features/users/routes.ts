import type { RouteRecordRaw } from 'vue-router';
import UsersView from './views/UsersView.vue';
import { administrationSidebar } from '@features/administration/config/sidebar.config';

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/administration/users',
    name: 'users',
    component: UsersView,
    meta: {
      requiresAuth: true,
      sidebarSections: administrationSidebar,
      breadcrumb: 'Users',
    },
  },
];
