<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  useSlots,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  GripVertical,
  Loader2,
  Inbox,
} from 'lucide-vue-next';
import SearchInput from './SearchInput.vue';

const { t } = useI18n();

interface FilterOption {
  label: string;
  value: string | number | boolean;
}

interface ColumnFilter {
  type: 'select' | 'multiselect';
  options?: FilterOption[];
  placeholder?: string;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filter?: ColumnFilter;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
  headerClass?: string;
  cellClass?: string;
  truncate?: boolean;
  maxWidth?: string;
  resizable?: boolean;
  minWidth?: number;
  width?: number;
}

interface Action {
  label: string;
  handler: (row: Record<string, unknown>) => void;
  class?: string;
}

interface Props {
  data?: Record<string, unknown>[];
  columns?: Column[];
  title?: string;
  description?: string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  paginated?: boolean;
  perPage?: number;
  perPageOptions?: number[];
  showHeader?: boolean;
  emptyText?: string;
  rowKey?: string;
  rowClass?: (row: Record<string, unknown>) => string;
  actions?: Action[];
  // Server-side pagination props
  serverSide?: boolean;
  totalRows?: number;
  currentPage?: number;
  // Column resizing
  resizable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
  loading: false,
  searchable: false,
  searchPlaceholder: '',
  selectable: false,
  paginated: true,
  perPage: 10,
  perPageOptions: () => [10, 20, 50, 100],
  showHeader: true,
  emptyText: '',
  rowKey: 'id',
  serverSide: false,
  totalRows: 0,
  currentPage: 1,
  resizable: true,
});

const emit = defineEmits<{
  search: [query: string];
  sort: [key: string, order: 'asc' | 'desc'];
  filter: [filters: Record<string, unknown>];
  'selection-change': [rows: Record<string, unknown>[]];
  'page-change': [page: number];
  'per-page-change': [perPage: number];
  'row-click': [row: Record<string, unknown>];
}>();

const slots = useSlots();
const searchQuery = ref('');
const sortKey = ref<string>('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const internalPage = ref(1);
const selectedRows = ref<Record<string, unknown>[]>([]);
const columnFilters = ref<Record<string, unknown>>({});
const openFilterDropdown = ref<string | null>(null);

// Column resizing state
const columnWidths = ref<Record<string, number>>({});
const resizingColumn = ref<string | null>(null);
const resizeStartX = ref(0);
const resizeStartWidth = ref(0);

const applySort = (
  data: Record<string, unknown>[],
  key: string,
  order: 'asc' | 'desc',
): Record<string, unknown>[] => {
  const result = [...data];
  result.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === bVal) return 0;

    const comparison = String(aVal) > String(bVal) ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
  return result;
};

// Use external page for server-side, internal for client-side
const currentPage = computed({
  get: () => (props.serverSide ? props.currentPage : internalPage.value),
  set: (value) => {
    if (!props.serverSide) {
      internalPage.value = value;
    }
  },
});

const filteredData = computed(() => {
  let result = [...props.data];

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    );
  }

  // Column filters (client-side only)
  if (!props.serverSide && Object.keys(columnFilters.value).length > 0) {
    result = result.filter((row) => {
      return Object.entries(columnFilters.value).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = row[key];

        // Handle array of values (multiselect)
        if (Array.isArray(filterValue)) {
          return filterValue.length === 0 || filterValue.includes(cellValue);
        }

        // Handle single value
        return cellValue === filterValue;
      });
    });
  }

  // Sort
  if (sortKey.value) {
    result = applySort(result, sortKey.value, sortOrder.value);
  }

  return result;
});

const totalRows = computed(() =>
  props.serverSide ? props.totalRows : filteredData.value.length,
);

const totalPages = computed(() => Math.ceil(totalRows.value / props.perPage));

const startIndex = computed(() => (currentPage.value - 1) * props.perPage);

const endIndex = computed(() =>
  Math.min(startIndex.value + props.perPage, totalRows.value),
);

const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value;
  // For server-side, data is already paginated, but still apply client-side sort
  if (props.serverSide) {
    if (sortKey.value) {
      return applySort(props.data, sortKey.value, sortOrder.value);
    }
    return props.data;
  }
  return filteredData.value.slice(startIndex.value, endIndex.value);
});

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const totalColumns = computed(() => {
  let count = props.columns.length;
  if (props.selectable) count++;
  if (slots['row-actions'] || props.actions) count++;
  return count;
});

const isAllSelected = computed(() => {
  return (
    paginatedData.value.length > 0 &&
    selectedRows.value.length === paginatedData.value.length
  );
});

const isSomeSelected = computed(() => {
  return (
    selectedRows.value.length > 0 &&
    selectedRows.value.length < paginatedData.value.length
  );
});

const getRowKey = (
  row: Record<string, unknown>,
  index: number,
): string | number => {
  return (row[props.rowKey] as string | number) || index;
};

const getCellValue = (row: Record<string, unknown>, key: string): unknown => {
  return row[key];
};

const formatCellValue = (
  row: Record<string, unknown>,
  column: Column,
): string => {
  const value = getCellValue(row, column.key);
  if (column.formatter) {
    return column.formatter(value, row);
  }
  return String(value ?? '');
};

const handleSearch = (query: string): void => {
  searchQuery.value = query;
  if (!props.serverSide) {
    internalPage.value = 1;
  }
  emit('search', query);
};

const handleSort = (key: string): void => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  emit('sort', key, sortOrder.value);
};

const handleSortDirection = (key: string, order: 'asc' | 'desc'): void => {
  sortKey.value = key;
  sortOrder.value = order;
  emit('sort', key, order);
};

const toggleFilterDropdown = (columnKey: string): void => {
  openFilterDropdown.value =
    openFilterDropdown.value === columnKey ? null : columnKey;
};

const handleFilterChange = (columnKey: string, value: unknown): void => {
  if (value === null || value === undefined || value === '') {
    delete columnFilters.value[columnKey];
  } else {
    columnFilters.value[columnKey] = value;
  }

  // Reset to first page when filter changes
  if (!props.serverSide) {
    internalPage.value = 1;
  }

  emit('filter', { ...columnFilters.value });
};

const clearFilter = (columnKey: string): void => {
  delete columnFilters.value[columnKey];
  emit('filter', { ...columnFilters.value });
};

const getFilterOptions = (column: Column): FilterOption[] => {
  if (column.filter?.options) {
    return column.filter.options;
  }

  // Auto-generate options from data for client-side
  if (!props.serverSide) {
    const uniqueValues = new Set(
      props.data.map((row) => row[column.key]).filter((v) => v != null),
    );
    return Array.from(uniqueValues).map((value) => ({
      label: String(value),
      value: value as string | number | boolean,
    }));
  }

  return [];
};

const hasActiveFilter = (columnKey: string): boolean => {
  return (
    columnKey in columnFilters.value && columnFilters.value[columnKey] != null
  );
};

const goToPage = (page: number): void => {
  if (page >= 1 && page <= totalPages.value) {
    if (props.serverSide) {
      // For server-side, just emit the event
      emit('page-change', page);
    } else {
      // For client-side, update internal page
      internalPage.value = page;
      emit('page-change', page);
    }
  }
};

const toggleSelectAll = (): void => {
  if (isAllSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = [...paginatedData.value];
  }
  emit('selection-change', selectedRows.value);
};

const isRowSelected = (row: Record<string, unknown>): boolean => {
  return selectedRows.value.some(
    (selected) => getRowKey(selected, 0) === getRowKey(row, 0),
  );
};

const toggleRowSelection = (row: Record<string, unknown>): void => {
  const index = selectedRows.value.findIndex(
    (selected) => getRowKey(selected, 0) === getRowKey(row, 0),
  );

  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(row);
  }

  emit('selection-change', selectedRows.value);
};

watch(
  () => props.data,
  () => {
    if (!props.serverSide) {
      internalPage.value = 1;
    }
    selectedRows.value = [];
  },
);

// Column resizing functions
const getColumnWidth = (column: Column): string => {
  if (columnWidths.value[column.key]) {
    return `${columnWidths.value[column.key]}px`;
  }
  if (column.width) {
    return `${column.width}px`;
  }
  return 'auto';
};

const isColumnResizable = (column: Column): boolean => {
  if (column.resizable === false) return false;
  return props.resizable;
};

const startResize = (event: MouseEvent, columnKey: string): void => {
  event.preventDefault();
  event.stopPropagation();

  resizingColumn.value = columnKey;
  resizeStartX.value = event.clientX;

  const column = props.columns.find((c) => c.key === columnKey);
  if (column) {
    resizeStartWidth.value =
      columnWidths.value[columnKey] || column.width || 150;
  }

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (event: MouseEvent): void => {
  if (!resizingColumn.value) return;

  const diff = event.clientX - resizeStartX.value;
  const newWidth = resizeStartWidth.value + diff;

  const column = props.columns.find((c) => c.key === resizingColumn.value);
  const minWidth = column?.minWidth || 80;

  if (newWidth >= minWidth) {
    columnWidths.value[resizingColumn.value] = newWidth;
  }
};

const stopResize = (): void => {
  resizingColumn.value = null;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

onMounted(() => {
  // Initialize column widths from column definitions
  props.columns.forEach((column) => {
    if (column.width && !columnWidths.value[column.key]) {
      columnWidths.value[column.key] = column.width;
    }
  });
});

onBeforeUnmount(() => {
  // Clean up event listeners
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<template>
  <div class="w-full">
    <!-- Table Header with Actions -->
    <div
      v-if="showHeader"
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
    >
      <div>
        <h3
          v-if="title"
          class="text-2xl font-semibold text-gray-900 dark:text-white"
        >
          {{ title }}
        </h3>
        <p v-if="description" class="text-gray-500 dark:text-gray-400 mt-1">
          {{ description }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Search and Filters -->
    <div
      v-if="searchable || $slots.filters"
      class="flex flex-col sm:flex-row gap-4 mb-4"
    >
      <div v-if="searchable" class="flex-1">
        <SearchInput
          v-model="searchQuery"
          :placeholder="searchPlaceholder || t('common.search')"
          @search="handleSearch"
        />
      </div>
      <div v-if="$slots.filters" class="flex gap-2">
        <slot name="filters"></slot>
      </div>
    </div>

    <!-- Table Container - Desktop View -->
    <div
      class="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Table Head -->
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-if="selectable" scope="col" class="w-12 px-6 py-3">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isSomeSelected"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                @change="toggleSelectAll"
              />
            </th>

            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative"
              :class="column.headerClass"
              :style="{ width: getColumnWidth(column) }"
            >
              <!-- Custom header slot -->
              <slot
                v-if="$slots[`header-${column.key}`]"
                :name="`header-${column.key}`"
              ></slot>

              <!-- Default header content -->
              <div v-else class="flex items-center gap-2">
                <div
                  class="flex items-center gap-2"
                  :class="{
                    'cursor-pointer select-none': column.sortable !== false,
                  }"
                  @click="
                    column.sortable !== false ? handleSort(column.key) : null
                  "
                >
                  <span>{{ column.label }}</span>
                  <div v-if="column.sortable !== false" class="flex flex-col">
                    <span
                      class="cursor-pointer leading-none p-0.5"
                      @click.stop="handleSortDirection(column.key, 'asc')"
                    >
                      <ChevronUp
                        class="h-3 w-3 -mb-1"
                        :class="
                          sortKey === column.key && sortOrder === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400'
                        "
                      />
                    </span>
                    <span
                      class="cursor-pointer leading-none p-0.5"
                      @click.stop="handleSortDirection(column.key, 'desc')"
                    >
                      <ChevronDown
                        class="h-3 w-3"
                        :class="
                          sortKey === column.key && sortOrder === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400'
                        "
                      />
                    </span>
                  </div>
                </div>

                <!-- Filter Button -->
                <div v-if="column.filterable" class="relative">
                  <button
                    type="button"
                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    :class="{
                      'text-blue-600 dark:text-blue-400': hasActiveFilter(
                        column.key,
                      ),
                      'text-gray-400': !hasActiveFilter(column.key),
                    }"
                    @click.stop="toggleFilterDropdown(column.key)"
                  >
                    <Filter class="h-5 w-5" />
                  </button>

                  <!-- Filter Dropdown -->
                  <div
                    v-if="openFilterDropdown === column.key"
                    class="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                    @click.stop
                  >
                    <div class="p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span
                          class="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {{ t('common.filter') }} {{ column.label }}
                        </span>
                        <button
                          v-if="hasActiveFilter(column.key)"
                          type="button"
                          class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          @click="clearFilter(column.key)"
                        >
                          {{ t('common.clear') }}
                        </button>
                      </div>

                      <select
                        :value="columnFilters[column.key] || ''"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        @change="
                          (e) =>
                            handleFilterChange(
                              column.key,
                              (e.target as HTMLSelectElement).value,
                            )
                        "
                      >
                        <option value="">
                          {{ column.filter?.placeholder || t('common.all') }}
                        </option>
                        <option
                          v-for="option in getFilterOptions(column)"
                          :key="String(option.value)"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resize Handle -->
              <div
                v-if="isColumnResizable(column)"
                class="absolute top-0 right-0 h-full w-1 cursor-col-resize group hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
                @mousedown="startResize($event, column.key)"
              >
                <div
                  class="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical
                    class="h-5 w-5 text-gray-400 dark:text-gray-500"
                  />
                </div>
              </div>
            </th>

            <th
              v-if="$slots['row-actions'] || actions"
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ t('common.actions') }}
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody
          class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
        >
          <tr v-if="loading" class="text-center">
            <td :colspan="totalColumns" class="px-6 py-12">
              <div class="flex items-center justify-center">
                <Loader2 class="animate-spin h-8 w-8 text-blue-600" />
              </div>
            </td>
          </tr>

          <tr v-else-if="paginatedData.length === 0" class="text-center">
            <td
              :colspan="totalColumns"
              class="px-6 py-12 text-sm text-gray-500 dark:text-gray-400"
            >
              <slot name="empty">
                <div class="flex flex-col items-center">
                  <Inbox class="h-12 w-12 text-gray-400 mb-4" />
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ emptyText || t('common.noDataAvailable') }}
                  </p>
                </div>
              </slot>
            </td>
          </tr>

          <tr
            v-for="(row, index) in paginatedData"
            v-else
            :key="getRowKey(row, index)"
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            :class="rowClass ? rowClass(row) : ''"
            @click="emit('row-click', row)"
          >
            <td v-if="selectable" class="w-12 px-6 py-4">
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                @change="toggleRowSelection(row)"
              />
            </td>

            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 text-sm text-gray-900 dark:text-white"
              :class="[
                column.cellClass,
                column.truncate ? '' : 'whitespace-nowrap',
              ]"
              :style="{
                width: getColumnWidth(column),
                maxWidth: column.truncate
                  ? getColumnWidth(column)
                  : column.maxWidth || 'none',
              }"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getCellValue(row, column.key)"
              >
                <div
                  v-if="column.truncate"
                  class="truncate"
                  :title="String(formatCellValue(row, column))"
                >
                  {{ formatCellValue(row, column) }}
                </div>
                <template v-else>
                  {{ formatCellValue(row, column) }}
                </template>
              </slot>
            </td>

            <td
              v-if="$slots['row-actions'] || actions"
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <slot name="row-actions" :row="row">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-for="action in actions"
                    :key="action.label"
                    type="button"
                    :class="
                      action.class ||
                      'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                    "
                    @click="action.handler(row)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 class="animate-spin h-8 w-8 text-blue-600" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="paginatedData.length === 0"
        class="flex flex-col items-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <slot name="empty">
          <Inbox class="h-12 w-12 text-gray-400 mb-4" />
          <p class="text-gray-500 dark:text-gray-400">
            {{ emptyText || t('common.noDataAvailable') }}
          </p>
        </slot>
      </div>

      <!-- Mobile Cards -->
      <div
        v-for="(row, index) in paginatedData"
        v-else
        :key="getRowKey(row, index)"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
        :class="rowClass ? rowClass(row) : ''"
        @click="emit('row-click', row)"
      >
        <!-- Selection Checkbox -->
        <div
          v-if="selectable"
          class="flex items-center pb-2 border-b border-gray-200 dark:border-gray-700"
        >
          <input
            type="checkbox"
            :checked="isRowSelected(row)"
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            @change="toggleRowSelection(row)"
          />
          <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">{{
            t('common.select')
          }}</span>
        </div>

        <!-- Card Content -->
        <div class="space-y-2">
          <div
            v-for="column in columns"
            :key="column.key"
            class="flex justify-between items-start gap-2"
          >
            <span
              class="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[100px]"
            >
              {{ column.label }}:
            </span>
            <span
              class="text-sm text-gray-900 dark:text-white text-right flex-1"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getCellValue(row, column.key)"
              >
                {{ formatCellValue(row, column) }}
              </slot>
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div
          v-if="$slots['row-actions'] || actions"
          class="pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <slot name="row-actions" :row="row">
            <div class="flex items-center justify-end gap-2 flex-wrap">
              <button
                v-for="action in actions"
                :key="action.label"
                type="button"
                :class="
                  action.class ||
                  'px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700'
                "
                @click.stop="action.handler(row)"
              >
                {{ action.label }}
              </button>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="paginated && !loading && paginatedData.length > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
    >
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ t('common.showing') }}
          <span class="font-medium">{{ startIndex + 1 }}</span>
          {{ t('common.to') }}
          <span class="font-medium">{{ endIndex }}</span>
          {{ t('common.of') }}
          <span class="font-medium">{{ totalRows }}</span>
          {{ t('common.results') }}
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-700 dark:text-gray-300">
            {{ t('common.show') }}
          </label>
          <div class="relative inline-block">
            <select
              :value="perPage"
              class="appearance-none px-3 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              @change="
                emit(
                  'per-page-change',
                  Number(($event.target as HTMLSelectElement).value),
                )
              "
            >
              <option
                v-for="option in perPageOptions"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
            <ChevronDown
              class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none"
            />
          </div>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            {{ t('common.entries') }}
          </label>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
          @click="goToPage(currentPage - 1)"
        >
          {{ t('common.previous') }}
        </button>

        <div class="flex gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            class="px-3 py-2 rounded-lg text-sm font-medium"
            :class="[
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600',
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
          @click="goToPage(currentPage + 1)"
        >
          {{ t('common.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
