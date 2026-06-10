import type { RouteRecordRaw } from 'vue-router';

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    redirect: '/dashboard',
  },
];
