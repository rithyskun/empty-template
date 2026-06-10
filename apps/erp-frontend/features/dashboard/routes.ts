import type { RouteRecordRaw } from 'vue-router';
import HomeView from './views/HomeView.vue';

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true },
  },
];
