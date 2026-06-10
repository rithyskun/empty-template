export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: MenuItem[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuSections: MenuSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/' },
      { label: 'Users', path: '/users' },
      { label: 'Roles', path: '/roles' },
      { label: 'Permissions', path: '/permissions' },
    ],
  },
];
