<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from '@features/layout/composables/useLayout';
import AdvanceRequestForm from '../components/AdvanceRequestForm.vue';
import TravelAllowanceRequestForm from '../components/TravelAllowanceRequestForm.vue';

const route = useRoute();
const { setSidebarTitle } = useLayout();
setSidebarTitle('Advances');

const advanceType = computed(() => {
  const type = route.query.type;
  if (type === 'travel') return 'travel';
  return 'department';
});
</script>

<template>
  <div>
    <TravelAllowanceRequestForm v-if="advanceType === 'travel'" />
    <AdvanceRequestForm v-else />
  </div>
</template>
