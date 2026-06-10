import type { MenuSection } from '@/config/menu.config';

export const administrationSidebar: MenuSection[] = [
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        path: '/administration/users',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      },
      {
        label: 'Roles',
        path: '/administration/roles',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      },
      {
        label: 'Permissions',
        path: '/administration/permissions',
        icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2.268a2 2 0 01-.586 1.414l-1.293 1.293a1 1 0 01-1.414 0l-1.293-1.293A2 2 0 012.268 20H2v-2h2v-2h2v-2h2.257A6 6 0 0115 7z',
      },
    ],
  },
];
