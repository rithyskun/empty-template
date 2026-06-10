import type { RouteRecordRaw } from 'vue-router';
import LoginView from './views/LoginView.vue';
import Verify2FAView from './views/Verify2FAView.vue';
import PendingApprovalView from './views/PendingApprovalView.vue';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/verify-2fa',
    name: 'verify-2fa',
    component: Verify2FAView,
    meta: { requiresAuth: false },
  },
  {
    path: '/pending-approval',
    name: 'pending-approval',
    component: PendingApprovalView,
    meta: { requiresAuth: false },
  },
];
