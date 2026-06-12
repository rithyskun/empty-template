<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLayout } from '@features/layout/composables/useLayout';
import { useAdvances } from '../composables/useAdvances';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';

const { setSidebarTitle } = useLayout();
setSidebarTitle('Advances');

const router = useRouter();
const {
  requests,
  repayments,
  isLoading,
  repaymentsByRequest,
  totalOutstanding,
  upcomingRepayments,
  loadRequests,
  loadRepayments,
} = useAdvances();

const expandedRows = ref<Set<string>>(new Set());

onMounted(async () => {
  await loadRequests({ status: 'DISBURSED', limit: 50 });
  await loadRepayments();
});

function toggleRow(id: string) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id);
  } else {
    expandedRows.value.add(id);
  }
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

function getRepaymentsForRequest(requestId: string) {
  return repaymentsByRequest.value.get(requestId) ?? [];
}

function getPaidAmount(requestId: string) {
  const reps = getRepaymentsForRequest(requestId);
  return reps.filter((r) => r.paid).reduce((sum, r) => sum + r.amount, 0);
}

function getRemainingAmount(requestId: string) {
  const reps = getRepaymentsForRequest(requestId);
  return reps.filter((r) => !r.paid).reduce((sum, r) => sum + r.amount, 0);
}

function getProgressPercent(requestId: string, totalAmount: number) {
  if (!totalAmount) return 0;
  const paid = getPaidAmount(requestId);
  return Math.min(100, Math.round((paid / totalAmount) * 100));
}

function isOverdue(dueDate: string) {
  return (
    new Date(dueDate) < new Date() && new Date(dueDate).getTime() < Date.now()
  );
}

function navigateTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
        Repayment Schedule
      </h1>
      <p class="text-gray-600 dark:text-dark-text-secondary mt-1">
        Track advance repayment installments and outstanding balances.
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Total Outstanding
            </p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {{ formatCurrency(totalOutstanding) }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <DollarSign class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Upcoming (30 Days)
            </p>
            <p
              class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1"
            >
              {{ upcomingRepayments.length }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
          >
            <Calendar class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-dark-text-secondary">
              Active Advances
            </p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {{ requests.length }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <Clock class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Repayment Table -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden"
    >
      <div
        class="px-5 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between"
      >
        <h3 class="font-semibold text-gray-900 dark:text-dark-text">
          Active Repayment Schedules
        </h3>
        <span class="text-sm text-gray-500 dark:text-dark-text-secondary">
          {{ requests.length }} advance(s) with repayments
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border"
            >
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary w-10"
              ></th>
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
                class="text-right px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Total Amount
              </th>
              <th
                class="text-right px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Paid
              </th>
              <th
                class="text-right px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Remaining
              </th>
              <th
                class="text-center px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Progress
              </th>
              <th
                class="text-left px-5 py-3 font-medium text-gray-500 dark:text-dark-text-secondary"
              >
                Next Due
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td
                colspan="8"
                class="px-5 py-8 text-center text-gray-500 dark:text-dark-text-secondary"
              >
                Loading repayment schedules...
              </td>
            </tr>
            <tr v-else-if="requests.length === 0">
              <td
                colspan="8"
                class="px-5 py-8 text-center text-gray-500 dark:text-dark-text-secondary"
              >
                No disbursed advances with repayment schedules found.
              </td>
            </tr>
            <template v-for="req in requests" :key="req.id">
              <!-- Main Row -->
              <tr
                class="border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors cursor-pointer"
                @click="toggleRow(req.id)"
              >
                <td class="px-5 py-3">
                  <component
                    :is="expandedRows.has(req.id) ? ChevronUp : ChevronDown"
                    class="w-4 h-4 text-gray-400 dark:text-dark-text-tertiary"
                  />
                </td>
                <td
                  class="px-5 py-3 font-medium text-gray-900 dark:text-dark-text"
                >
                  {{ req.requestNo }}
                </td>
                <td
                  class="px-5 py-3 text-gray-700 dark:text-dark-text-secondary"
                >
                  {{ req.requesterName || '-' }}
                </td>
                <td
                  class="px-5 py-3 text-right font-medium text-gray-900 dark:text-dark-text"
                >
                  {{ formatCurrency(req.amount, req.currency) }}
                </td>
                <td
                  class="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400"
                >
                  {{ formatCurrency(getPaidAmount(req.id), req.currency) }}
                </td>
                <td
                  class="px-5 py-3 text-right text-red-600 dark:text-red-400 font-medium"
                >
                  {{ formatCurrency(getRemainingAmount(req.id), req.currency) }}
                </td>
                <td class="px-5 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                        :style="{
                          width: getProgressPercent(req.id, req.amount) + '%',
                        }"
                      ></div>
                    </div>
                    <span
                      class="text-xs text-gray-500 dark:text-dark-text-secondary w-8 text-left"
                    >
                      {{ getProgressPercent(req.id, req.amount) }}%
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <span
                    v-if="
                      getRepaymentsForRequest(req.id).filter((r) => !r.paid)[0]
                    "
                    :class="[
                      'inline-flex items-center gap-1.5 text-xs',
                      isOverdue(
                        getRepaymentsForRequest(req.id).filter(
                          (r) => !r.paid,
                        )[0].dueDate,
                      )
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-gray-600 dark:text-dark-text-secondary',
                    ]"
                  >
                    <AlertCircle
                      v-if="
                        isOverdue(
                          getRepaymentsForRequest(req.id).filter(
                            (r) => !r.paid,
                          )[0].dueDate,
                        )
                      "
                      class="w-3.5 h-3.5"
                    />
                    {{
                      formatDate(
                        getRepaymentsForRequest(req.id).filter(
                          (r) => !r.paid,
                        )[0].dueDate,
                      )
                    }}
                  </span>
                  <span
                    v-else
                    class="text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle class="w-3.5 h-3.5 inline mr-1" />
                    Paid
                  </span>
                </td>
              </tr>

              <!-- Expanded Detail Row -->
              <tr v-if="expandedRows.has(req.id)">
                <td
                  colspan="8"
                  class="px-5 py-4 bg-gray-50/50 dark:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border/50"
                >
                  <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr
                          class="border-b border-gray-200 dark:border-dark-border"
                        >
                          <th
                            class="text-left py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Installment
                          </th>
                          <th
                            class="text-left py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Due Date
                          </th>
                          <th
                            class="text-right py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Amount
                          </th>
                          <th
                            class="text-center py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Status
                          </th>
                          <th
                            class="text-left py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Paid Date
                          </th>
                          <th
                            class="text-left py-2 px-3 font-medium text-gray-500 dark:text-dark-text-secondary"
                          >
                            Settlement Ref
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="rep in getRepaymentsForRequest(req.id).sort(
                            (a, b) => a.installmentNo - b.installmentNo,
                          )"
                          :key="rep.id"
                          class="border-b border-gray-100 dark:border-dark-border/30 last:border-0"
                        >
                          <td
                            class="py-2 px-3 text-gray-700 dark:text-dark-text-secondary"
                          >
                            #{{ rep.installmentNo }}
                          </td>
                          <td
                            class="py-2 px-3 text-gray-700 dark:text-dark-text-secondary"
                          >
                            {{ formatDate(rep.dueDate) }}
                          </td>
                          <td
                            class="py-2 px-3 text-right font-medium text-gray-900 dark:text-dark-text"
                          >
                            {{ formatCurrency(rep.amount, req.currency) }}
                          </td>
                          <td class="py-2 px-3 text-center">
                            <span
                              v-if="rep.paid"
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            >
                              <CheckCircle class="w-3 h-3" />
                              Paid
                            </span>
                            <span
                              v-else-if="isOverdue(rep.dueDate)"
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            >
                              <AlertCircle class="w-3 h-3" />
                              Overdue
                            </span>
                            <span
                              v-else
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            >
                              <Clock class="w-3 h-3" />
                              Pending
                            </span>
                          </td>
                          <td
                            class="py-2 px-3 text-gray-500 dark:text-dark-text-secondary"
                          >
                            {{ rep.paidAt ? formatDate(rep.paidAt) : '-' }}
                          </td>
                          <td
                            class="py-2 px-3 text-gray-500 dark:text-dark-text-secondary"
                          >
                            <span
                              v-if="rep.payrollRunId"
                              class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              @click.stop="
                                navigateTo(
                                  `/settlements?ref=${rep.payrollRunId}`,
                                )
                              "
                            >
                              {{ rep.payrollRunId.slice(0, 8) }}...
                            </span>
                            <span v-else>-</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
