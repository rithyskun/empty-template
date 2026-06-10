import type { MenuSection } from '@/config/menu.config';
import { Users, Shield, Key } from 'lucide-vue-next';

export const administrationSidebar: MenuSection[] = [
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        path: '/administration/users',
        icon: Users,
      },
      {
        label: 'Roles',
        path: '/administration/roles',
        icon: Shield,
      },
      {
        label: 'Permissions',
        path: '/administration/permissions',
        icon: Key,
      },
    ],
  },
];
