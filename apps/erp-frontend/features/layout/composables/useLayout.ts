import { ref, computed } from 'vue';

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

const sidebarMode = ref<SidebarMode>('expanded');
const mobileSidebarOpen = ref(false);
const sidebarTitle = ref('');

const order: SidebarMode[] = ['expanded', 'collapsed', 'hidden'];

export function useLayout() {
  const toggleSidebar = () => {
    const currentIdx = order.indexOf(sidebarMode.value);
    sidebarMode.value = order[(currentIdx + 1) % order.length];
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

  const sidebarWidth = computed(() => {
    if (sidebarMode.value === 'collapsed') return 'w-16';
    return 'w-64';
  });

  const sidebarCollapsed = computed(() => sidebarMode.value === 'collapsed');
  const sidebarHidden = computed(() => sidebarMode.value === 'hidden');

  return {
    sidebarMode,
    sidebarCollapsed,
    sidebarHidden,
    mobileSidebarOpen,
    sidebarTitle,
    sidebarWidth,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    setSidebarTitle,
  };
}
