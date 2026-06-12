import type { RouteRecordRaw } from 'vue-router';
import AdvancesView from './views/AdvancesView.vue';
import NewAdvanceView from './views/NewAdvanceView.vue';
import RepaymentScheduleView from './views/RepaymentScheduleView.vue';
import { advancesSidebar } from './config/sidebar.config';

export const advanceRoutes: RouteRecordRaw[] = [
  {
    path: '/advances/dashboard',
    name: 'advances',
    component: AdvancesView,
    meta: {
      requiresAuth: true,
      sidebarSections: advancesSidebar,
      breadcrumb: 'Advances',
    },
  },
  {
    path: '/advances/new',
    name: 'advances-new',
    component: NewAdvanceView,
    meta: {
      requiresAuth: true,
      sidebarSections: advancesSidebar,
      breadcrumb: 'New Advance',
    },
  },
  {
    path: '/advances/repayments',
    name: 'advances-repayments',
    component: RepaymentScheduleView,
    meta: {
      requiresAuth: true,
      sidebarSections: advancesSidebar,
      breadcrumb: 'Repayment Schedule',
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
