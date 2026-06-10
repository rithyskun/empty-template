import type { RouteRecordRaw } from 'vue-router';
import AdministrationView from './views/AdministrationView.vue';
import { administrationSidebar } from './config/sidebar.config';

export const administrationRoutes: RouteRecordRaw[] = [
  {
    path: '/administration',
    name: 'administration',
    component: AdministrationView,
    meta: {
      requiresAuth: true,
      sidebarSections: administrationSidebar,
      breadcrumb: 'Administration',
    },
  },
];
