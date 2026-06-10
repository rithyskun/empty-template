import type { MenuSection } from '@/config/menu.config';

export const advancesSidebar: MenuSection[] = [
  {
    title: 'Advances',
    items: [
      { label: 'Dashboard', path: '/advances/dashboard' },
      { label: 'New Advance', path: '/advances/new' },
      { label: 'Repayment Schedule', path: '/advances/repayments' },
      { label: 'History', path: '/advances/history' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Summary', path: '/advances/reports/summary' },
      { label: 'Export', path: '/advances/reports/export' },
    ],
  },
];
