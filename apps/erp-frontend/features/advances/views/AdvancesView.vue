<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLayout } from '@features/layout/composables/useLayout';
import { useAdvances } from '../composables/useAdvances';
import {
  DollarSign,
  FilePlus,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
  TrendingUp,
} from 'lucide-vue-next';

const emit = defineEmits<{
  action: [action: string];
}>();

const { setSidebarTitle } = useLayout();
setSidebarTitle('Advances');

const router = useRouter();
const { requests, isLoading, stats, loadRequests, loadStats } = useAdvances();

onMounted(() => {
  loadRequests({ limit: 5 });
  loadStats();
});

function navigateTo(path: string) {
  router.push(path);
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    case 'PENDING':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    case 'APPROVED':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    case 'REJECTED':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'DISBURSED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Advances Dashboard
      </h1>
      <p class="text-gray-600 dark:text-dark-text-secondary mt-1">
        Manage employee advances and track repayment schedules.
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Total Requests
            </p>
            <p
              class="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1"
            >
              {{ stats.total }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <DollarSign class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Pending
            </p>
            <p
              class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1"
            >
              {{ stats.pending }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
          >
            <Clock class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Approved
            </p>
            <p
              class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1"
            >
              {{ stats.approved }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
          >
            <CheckCircle
              class="w-5 h-5 text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Drafts
            </p>
            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
              {{ stats.draft }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            <FileText class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <button
        class="flex items-center gap-4 p-5 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left group"
        @click="emit('action', 'new-advance-modal')"
      >
        <div
          class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"
        >
          <FilePlus
            class="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"
          />
        </div>
        <div>
          <p
            class="font-medium text-gray-900 dark:text-dark-text group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
          >
            New Advance Request
          </p>
          <p class="text-xs text-gray-500 dark:text-dark-text-secondary">
            Create a new advance or travel allowance request
          </p>
        </div>
      </button>

      <button
        class="flex items-center gap-4 p-5 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
        @click="navigateTo('/advances/repayments')"
      >
        <div
          class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
        >
          <TrendingUp
            class="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
          />
        </div>
        <div>
          <p
            class="font-medium text-gray-900 dark:text-dark-text group-hover:text-blue-700 dark:group-hover:text-blue-300"
          >
            Repayment Schedule
          </p>
          <p class="text-xs text-gray-500 dark:text-dark-text-secondary">
            View upcoming and past repayments
          </p>
        </div>
      </button>
    </div>

    <!-- Recent Requests -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden"
    >
      <div
        class="px-5 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between"
      >
        <h3 class="font-semibold text-gray-900 dark:text-dark-text">
          Recent Requests
        </h3>
        <button
          class="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          @click="navigateTo('/advances/history')"
        >
          View All
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border"
            >
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Ref No
              </th>
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Requester
              </th>
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Department
              </th>
              <th
                class="text-right px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Amount
              </th>
              <th
                class="text-center px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Status
              </th>
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td
                colspan="6"
                class="px-5 py-8 text-center text-gray-500 dark:text-dark-text-secondary"
              >
                Loading...
              </td>
            </tr>
            <tr v-else-if="requests.length === 0">
              <td
                colspan="6"
                class="px-5 py-8 text-center text-gray-500 dark:text-dark-text-secondary"
              >
                No advance requests found.
                <button
                  class="text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
                  @click="emit('action', 'new-advance-modal')"
                >
                  Create one now
                </button>
              </td>
            </tr>
            <tr
              v-for="req in requests"
              :key="req.id"
              class="border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors cursor-pointer"
              @click="
                navigateTo(
                  `/advances/new?type=${req.type || 'department'}&id=${req.id}`,
                )
              "
            >
              <td
                class="px-5 py-3 font-medium text-gray-900 dark:text-dark-text"
              >
                {{ req.requestNo }}
              </td>
              <td class="px-5 py-3 text-gray-700 dark:text-dark-text-secondary">
                {{ req.requesterName || '-' }}
              </td>
              <td class="px-5 py-3 text-gray-700 dark:text-dark-text-secondary">
                {{ req.department || '-' }}
              </td>
              <td
                class="px-5 py-3 text-right font-medium text-gray-900 dark:text-dark-text"
              >
                {{ formatCurrency(req.amount, req.currency) }}
              </td>
              <td class="px-5 py-3 text-center">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(req.status),
                  ]"
                >
                  {{ req.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-500 dark:text-dark-text-secondary">
                {{ formatDate(req.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
