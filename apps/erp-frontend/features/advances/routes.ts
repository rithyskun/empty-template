import type { RouteRecordRaw } from 'vue-router';
import AdvancesView from './views/AdvancesView.vue';
import { advancesSidebar } from './config/sidebar.config';

export const advanceRoutes: RouteRecordRaw[] = [
  {
    path: '/advances',
    name: 'advances',
    component: AdvancesView,
    meta: {
      requiresAuth: true,
      sidebarSections: advancesSidebar,
      breadcrumb: 'Advances',
    },
  },
  {
    path: '/advances/:subPage',
    name: 'advances-sub',
    component: AdvancesView,
    meta: {
      requiresAuth: true,
      sidebarSections: advancesSidebar,
      breadcrumb: 'Advances',
    },
  },
];
