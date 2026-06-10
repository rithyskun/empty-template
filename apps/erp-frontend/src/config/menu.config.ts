import type { Component } from 'vue';
import { Home } from 'lucide-vue-next';

export interface MenuItem {
  label: string;
  path: string;
  icon?: Component;
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
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: Home,
      },
    ],
  },
];
