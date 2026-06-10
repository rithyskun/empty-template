import type { MenuSection } from '@/config/menu.config';

export const settlementsSidebar: MenuSection[] = [
  {
    title: 'Settlements',
    items: [
      { label: 'Dashboard', path: '/settlements' },
      { label: 'New Batch', path: '/settlements/new' },
      { label: 'Pending', path: '/settlements/pending' },
      { label: 'History', path: '/settlements/history' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Summary', path: '/settlements/reports/summary' },
      { label: 'Export', path: '/settlements/reports/export' },
    ],
  },
];
