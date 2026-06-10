<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Home, ChevronRight } from 'lucide-vue-next';

const { t } = useI18n();

interface BreadcrumbItem {
  label: string;
  path: string;
  clickable: boolean;
}

const route = useRoute();

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const pathArray = route.path.split('/').filter((p) => p);
  const crumbs: BreadcrumbItem[] = [];

  // Build breadcrumbs from path segments
  let currentPath = '';
  pathArray.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Get label from route meta or format segment
    const routeRecord = route.matched[index + 1];
    const breadcrumbKey = routeRecord?.meta?.breadcrumb as string;
    const label = breadcrumbKey ? t(breadcrumbKey) : formatSegment(segment);

    crumbs.push({
      label,
      path: currentPath,
      clickable: index < pathArray.length - 1,
    });
  });
  return crumbs;
});

const formatSegment = (segment: string): string => {
  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center space-x-2 text-sm">
    <router-link
      to="/"
      class="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
    >
      <Home class="h-5 w-5" />
    </router-link>

    <template v-for="(crumb, index) in breadcrumbs" :key="index">
      <ChevronRight class="h-5 w-5 text-gray-400 dark:text-gray-600" />

      <router-link
        v-if="crumb.clickable"
        :to="crumb.path"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        {{ crumb.label }}
      </router-link>

      <span
        v-else
        class="font-medium text-gray-900 dark:text-white"
        :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
      >
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>
