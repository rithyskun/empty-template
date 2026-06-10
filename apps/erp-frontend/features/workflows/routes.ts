import type { RouteRecordRaw } from 'vue-router';
import WorkflowsView from './views/WorkflowsView.vue';
import { workflowsSidebar } from './config/sidebar.config';

export const workflowRoutes: RouteRecordRaw[] = [
  {
    path: '/workflows',
    name: 'workflows',
    component: WorkflowsView,
    meta: {
      requiresAuth: true,
      sidebarSections: workflowsSidebar,
      breadcrumb: 'Workflows',
    },
  },
  {
    path: '/workflows/:subPage',
    name: 'workflows-sub',
    component: WorkflowsView,
    meta: {
      requiresAuth: true,
      sidebarSections: workflowsSidebar,
      breadcrumb: 'Workflows',
    },
  },
];
