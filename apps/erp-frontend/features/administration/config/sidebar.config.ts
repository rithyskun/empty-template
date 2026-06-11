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
        roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      },
      {
        label: 'Roles',
        path: '/administration/roles',
        icon: Shield,
        roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      },
      {
        label: 'Permissions',
        path: '/administration/permissions',
        icon: Key,
        roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      },
    ],
  },
];
