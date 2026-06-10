import type { RouteRecordRaw } from 'vue-router';
import UsersView from './views/UsersView.vue';

export const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true },
  },
];
