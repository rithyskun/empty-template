import { ref, computed } from 'vue';

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
const sidebarTitle = ref('');

export function useLayout() {
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const openMobileSidebar = () => {
    mobileSidebarOpen.value = true;
  };

  const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false;
  };

  const setSidebarTitle = (title: string) => {
    sidebarTitle.value = title;
  };

  const sidebarWidth = computed(() =>
    sidebarCollapsed.value ? 'w-16' : 'w-64',
  );

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    sidebarTitle,
    sidebarWidth,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    setSidebarTitle,
  };
}
