import { ref } from 'vue';

const sidebarCollapsed = ref(false);
const openMenus = ref<Record<string, boolean>>({});
const openSections = ref<Record<string, boolean>>({});

export function useLayout() {
  return {
    sidebarCollapsed,
    toggleSidebar: () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    },
    openMenus,
    openSections,
  };
}
