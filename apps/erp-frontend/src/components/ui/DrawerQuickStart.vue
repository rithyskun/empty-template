<script setup lang="ts">
import { ref } from 'vue';
import {
  BaseDrawer,
  BaseButton,
  BaseInput,
  SearchInput,
  BaseSelect,
  ToggleSwitch,
} from './index';

// Drawer states
const leftDrawer = ref(false);
const rightDrawer = ref(false);

// Left drawer data
const search = ref('');
const filter = ref<string | number | null>(null);

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Featured', value: 'featured' },
];

// Right drawer form
const form = ref({
  name: '',
  email: '',
  category: null as string | number | null,
  description: '',
  active: true,
  featured: false,
});

const categories = [
  { label: 'Technology', value: 'tech' },
  { label: 'Business', value: 'business' },
  { label: 'Education', value: 'education' },
  { label: 'Healthcare', value: 'healthcare' },
];

// Handlers
const applySearch = (): void => {
  console.log('Search:', search.value, 'Filter:', filter.value);
  leftDrawer.value = false;
};

const handleSubmit = (): void => {
  console.log('Form submitted:', form.value);
  rightDrawer.value = false;
  resetForm();
};

const resetForm = (): void => {
  form.value = {
    name: '',
    email: '',
    category: null,
    description: '',
    active: true,
    featured: false,
  };
};
</script>

<template>
  <div>
    <!-- Quick Start Example -->
    <div>
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <BaseButton class="w-full" @click="leftDrawer = true">
          Left Drawer
        </BaseButton>
        <BaseButton class="w-full" @click="rightDrawer = true">
          Right Drawer
        </BaseButton>
      </div>
    </div>

    <!-- Left Drawer Example -->
    <BaseDrawer
      v-model="leftDrawer"
      position="left"
      title="Search & Filter"
      subtitle="Find what you're looking for"
      size="md"
    >
      <div class="space-y-4">
        <SearchInput v-model="search" placeholder="Search..." />

        <BaseSelect
          v-model="filter"
          :options="filterOptions"
          label="Filter by"
          searchable
        />

        <div class="pt-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Results
          </h3>
          <div class="space-y-2">
            <div
              v-for="i in 5"
              :key="i"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <p class="text-sm text-gray-900 dark:text-white">
                Result item {{ i }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="outline" @click="leftDrawer = false">
            Close
          </BaseButton>
          <BaseButton @click="applySearch"> Apply </BaseButton>
        </div>
      </template>
    </BaseDrawer>

    <!-- Right Drawer Example -->
    <BaseDrawer
      v-model="rightDrawer"
      position="right"
      title="Add New Item"
      subtitle="Fill in the details below"
      size="lg"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="form.name"
          label="Name"
          placeholder="Enter name"
          required
        />

        <BaseInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="email@example.com"
          required
        />

        <BaseSelect
          v-model="form.category"
          :options="categories"
          label="Category"
          placeholder="Select a category"
          required
        />

        <BaseInput
          v-model="form.description"
          label="Description"
          placeholder="Enter description"
        />

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="form.active" />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="form.featured" />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              Featured
            </label>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-between">
          <BaseButton variant="outline" @click="rightDrawer = false">
            Cancel
          </BaseButton>
          <div class="flex gap-3">
            <BaseButton variant="outline" @click="resetForm">
              Reset
            </BaseButton>
            <BaseButton @click="handleSubmit"> Save </BaseButton>
          </div>
        </div>
      </template>
    </BaseDrawer>
  </div>
</template>
