import type { RouteRecordRaw } from 'vue-router';
import LandingView from './views/LandingView.vue';

export const landingRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: LandingView,
    meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
  },
];
