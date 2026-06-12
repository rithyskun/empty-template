import type { MenuSection } from '@/config/menu.config';
import {
  LayoutDashboard,
  FilePlus,
  CalendarDays,
  History,
  BarChart3,
  Download,
} from 'lucide-vue-next';

export const advancesSidebar: MenuSection[] = [
  {
    title: 'Advances',
    items: [
      {
        label: 'Dashboard',
        path: '/advances/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'New Advance',
        path: '/advances/new',
        icon: FilePlus,
        action: 'new-advance-modal',
      },
      {
        label: 'Repayment Schedule',
        path: '/advances/repayments',
        icon: CalendarDays,
      },
      {
        label: 'History',
        path: '/advances/history',
        icon: History,
        badge: 0, // Set dynamically from useAdvances().totalRequests
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        label: 'Summary',
        path: '/advances/reports/summary',
        icon: BarChart3,
      },
      {
        label: 'Export',
        path: '/advances/reports/export',
        icon: Download,
      },
    ],
  },
];
