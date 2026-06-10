import type { MenuSection } from '@/config/menu.config';

export const workflowsSidebar: MenuSection[] = [
  {
    title: 'Workflows',
    items: [
      { label: 'Dashboard', path: '/workflows' },
      { label: 'Design', path: '/workflows/design' },
      { label: 'Approvals', path: '/workflows/approvals' },
      { label: 'History', path: '/workflows/history' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Summary', path: '/workflows/reports/summary' },
      { label: 'Export', path: '/workflows/reports/export' },
    ],
  },
];
