import type { RouteRecordRaw } from 'vue-router';
import SettlementsView from './views/SettlementsView.vue';
import { settlementsSidebar } from './config/sidebar.config';

export const settlementRoutes: RouteRecordRaw[] = [
  {
    path: '/settlements',
    name: 'settlements',
    component: SettlementsView,
    meta: {
      requiresAuth: true,
      sidebarSections: settlementsSidebar,
      breadcrumb: 'Settlements',
    },
  },
  {
    path: '/settlements/:subPage',
    name: 'settlements-sub',
    component: SettlementsView,
    meta: {
      requiresAuth: true,
      sidebarSections: settlementsSidebar,
      breadcrumb: 'Settlements',
    },
  },
];
