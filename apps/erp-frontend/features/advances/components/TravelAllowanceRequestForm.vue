<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@features/auth/composables/useAuth';
import { useLayout } from '@features/layout/composables/useLayout';
import { FileText, Download, X } from 'lucide-vue-next';
import { useAdvances } from '../composables/useAdvances';
import WorkflowTimeline from './WorkflowTimeline.vue';
import FileAttachmentUpload from './FileAttachmentUpload.vue';

const router = useRouter();
const route = useRoute();

const { t } = useI18n();
const { user } = useAuth();
const { setSidebarTitle } = useLayout();
const {
  workflowInstance,
  loadWorkflowInstance,
  approveWorkflowStage,
  rejectWorkflowStage,
} = useAdvances();

const mode = computed(() => {
  const id = route.query.id as string;
  return id ? 'view' : 'create';
});

const requestId = computed(() => route.query.id as string | undefined);

const scenario = computed(
  () =>
    route.query.scenario as
      | 'pending-checker'
      | 'pending-line-manager'
      | 'completed'
      | 'rejected'
      | undefined,
);

const canEdit = computed(() => mode.value === 'create');

const isCurrentApprover = computed(() => {
  if (!workflowInstance.value) return false;
  const currentStage = workflowInstance.value.stages.find(
    (s) => s.stageOrder === workflowInstance.value?.currentStage,
  );
  if (!currentStage) return false;
  return user.value?.roles?.includes(currentStage.assignedRole) ?? false;
});

const isRejected = computed(
  () => workflowInstance.value?.status === 'REJECTED',
);

const isCompleted = computed(
  () => workflowInstance.value?.status === 'COMPLETED',
);

const showApproveReject = computed(
  () => isCurrentApprover.value && !isRejected.value && !isCompleted.value,
);

setSidebarTitle('Advances');

interface AllowanceRow {
  type: string;
  typeEn: string;
  khmerLabel: string;
  numberOfDays: number | null;
  rate: number | null;
  currency: string;
  amount: number | null;
  remark: string;
}

const currencies = ['USD', 'KHR', 'THB'];
const today = new Date().toISOString().split('T')[0];

const form = ref({
  requestDate: today,
  requesterName: user.value
    ? `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
    : '',
  country: '',
  cityProvince: '',
  travelFrom: '',
  travelTo: '',
  numberOfDays: 1,
  missionPurpose: '',
  payrollAccountNumber: '',
  remarks: '',
});

const allowanceRows = ref<AllowanceRow[]>([
  {
    type: 'DAILY',
    typeEn: 'Daily Allowance',
    khmerLabel: 'ប្រាក់ហ៊ីមហោ',
    numberOfDays: 1,
    rate: null,
    currency: 'USD',
    amount: null,
    remark: '',
  },
  {
    type: 'ACCOMMODATION',
    typeEn: 'Accomodation Allowance',
    khmerLabel: 'ប្រាក់ហ៊ីមហោ',
    numberOfDays: 0,
    rate: null,
    currency: 'USD',
    amount: null,
    remark: '',
  },
  {
    type: 'TRANSPORTATION',
    typeEn: 'Transportation',
    khmerLabel: 'ប្រាក់ហ៊ីមហោ',
    numberOfDays: null,
    rate: null,
    currency: 'USD',
    amount: null,
    remark: '',
  },
]);

const totalAllowance = computed(() => {
  return allowanceRows.value.reduce((sum, row) => sum + (row.amount || 0), 0);
});

function calculateAmount(row: AllowanceRow) {
  if (row.numberOfDays != null && row.rate != null) {
    row.amount = row.numberOfDays * row.rate;
  }
}

function generateRefNo() {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `BUS-${yyyymmdd}-ADVTRA001`;
}

const isSubmitting = ref(false);
const submitted = ref(false);
const isDirty = ref(false);
const showConfirmDialog = ref(false);
const pendingTo = ref<RouteLocationNormalized | null>(null);
const attachments = ref<
  Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>
>([]);
const isUploading = ref(false);

function markDirty() {
  isDirty.value = true;
}

watch(form, markDirty, { deep: true });
watch(allowanceRows, markDirty, { deep: true });

function confirmLeave() {
  showConfirmDialog.value = false;
  isDirty.value = false;
  if (pendingTo.value) {
    router.push(pendingTo.value);
  }
}

function cancelLeave() {
  showConfirmDialog.value = false;
  pendingTo.value = null;
}

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value && !submitted.value) {
    pendingTo.value = to;
    showConfirmDialog.value = true;
    next(false);
  } else {
    next();
  }
});

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const payload = {
      ...form.value,
      requestNo: generateRefNo(),
      employeeId: user.value?.id || '',
      totalAdvanceAllowance: totalAllowance.value,
      currency: 'USD',
      items: allowanceRows.value
        .filter((row) => row.amount != null && row.amount > 0)
        .map((row) => ({
          allowanceType: row.type,
          numberOfDays: row.numberOfDays || 0,
          rate: row.rate || 0,
          currency: row.currency,
          amount: row.amount || 0,
          remark: row.remark,
        })),
    };

    console.log('Submitting travel allowance request:', payload);
    submitted.value = true;
    isDirty.value = false;
    setTimeout(() => (submitted.value = false), 3000);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleApprove() {
  if (!workflowInstance.value) return;
  isSubmitting.value = true;
  try {
    await approveWorkflowStage(
      workflowInstance.value.id,
      workflowInstance.value.currentStage,
    );
    await loadWorkflowInstance(requestId.value!);
  } catch (err) {
    console.error('Approval failed:', err);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleReject() {
  if (!workflowInstance.value) return;
  isSubmitting.value = true;
  try {
    await rejectWorkflowStage(
      workflowInstance.value.id,
      workflowInstance.value.currentStage,
    );
    await loadWorkflowInstance(requestId.value!);
  } catch (err) {
    console.error('Rejection failed:', err);
  } finally {
    isSubmitting.value = false;
  }
}

async function loadAttachments() {
  if (!requestId.value) return;
  try {
    const response = await useAdvances().loadAttachments(requestId.value);
    attachments.value = response.data || [];
  } catch (err) {
    console.error('Failed to load attachments:', err);
  }
}

const uploadProgress = ref(0);

async function handleUpload(file: File) {
  if (!requestId.value) return;
  isUploading.value = true;
  uploadProgress.value = 0;
  try {
    await useAdvances().uploadWithTus(requestId.value, file, {
      onProgress: (bytesUploaded, bytesTotal) => {
        uploadProgress.value = Math.round((bytesUploaded / bytesTotal) * 100);
      },
    });
    await loadAttachments();
  } catch (err) {
    console.error('Upload failed:', err);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

async function handleDeleteAttachment(id: string) {
  try {
    await useAdvances().deleteAttachment(id);
    attachments.value = attachments.value.filter((a) => a.id !== id);
  } catch (err) {
    console.error('Delete failed:', err);
  }
}

function handleDownload(id: string, fileName: string) {
  useAdvances()
    .downloadAttachment(id)
    .then((response) => {
      const url = window.URL.createObjectURL(response.data as unknown as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (!requestId.value) return;
  pollTimer = setInterval(() => {
    loadWorkflowInstance(requestId.value!, scenario.value);
  }, 10000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onMounted(() => {
  if (requestId.value) {
    loadWorkflowInstance(requestId.value, scenario.value);
    startPolling();
    loadAttachments();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Workflow Timeline -->
    <WorkflowTimeline
      v-if="workflowInstance"
      :stages="workflowInstance.stages"
      :current-stage="workflowInstance.currentStage"
      :instance-status="workflowInstance.status"
      :can-act="isCurrentApprover"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <!-- Status Banner -->
    <div
      v-if="isRejected"
      class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm text-center font-medium"
    >
      This travel allowance request has been rejected.
    </div>
    <div
      v-if="isCompleted"
      class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm text-center font-medium"
    >
      This travel allowance request has been fully approved.
    </div>

    <fieldset :disabled="!canEdit" class="min-w-0 border-0 p-0 m-0">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <!-- Logo placeholder -->
        <div class="flex-shrink-0">
          <div
            class="w-16 h-16 bg-emerald-700 dark:bg-emerald-800 rounded flex items-center justify-center text-white font-bold text-xs text-center leading-tight"
          >
            ABA<br />BANK
          </div>
        </div>
        <div class="flex-1 text-center">
          <h2
            class="text-lg font-bold text-gray-900 dark:text-dark-text tracking-wide"
          >
            សំណើជួយសម្រួលការធ្វើដំណើរ
          </h2>
          <h3
            class="text-base font-bold text-gray-900 dark:text-dark-text mt-1 uppercase"
          >
            Advanced Travelling Allowance Request
          </h3>
        </div>
        <div class="w-16 flex-shrink-0"></div>
      </div>

      <!-- Top Info Grid -->
      <div class="mb-6">
        <div
          class="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary"
        >
          <!-- Row 1: Ref No & Request Date -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-dark-border"
          >
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                លេខយោងប្រាក់:
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                Advance Ref No:
              </p>
            </div>
            <div class="px-3 py-2 md:col-span-1 border-b md:border-b-0">
              <input
                type="text"
                disabled
                :value="generateRefNo()"
                class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-dark-text-tertiary"
              />
            </div>
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                កាលបរិច្ឆេទស្នើសុំ :
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                Request date :
              </p>
            </div>
            <div class="px-3 py-2">
              <input
                v-model="form.requestDate"
                type="date"
                class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>

          <!-- Row 2: Country & City/Province & From & To -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-dark-border"
          >
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                ប្រទេស
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                Country
              </p>
            </div>
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border"
            >
              <input
                v-model="form.country"
                type="text"
                class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                ក្រុង/ខេត្ត
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                City/Province
              </p>
            </div>
            <div class="px-3 py-2">
              <input
                v-model="form.cityProvince"
                type="text"
                class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>

          <!-- Row 3: From date & To date -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-dark-border"
          >
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg md:col-span-2"
            ></div>
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                ចាប់ពីថ្ងៃ
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                From
              </p>
            </div>
            <div class="px-3 py-2">
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                ដល់ថ្ងៃ
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                To
              </p>
            </div>
          </div>

          <!-- Row 4: Number of Travelling Days -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-dark-border"
          >
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                ចំនួនថ្ងៃធ្វើដំណើរ
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                Number of Travelling Days
              </p>
            </div>
            <div class="px-3 py-2 md:col-span-3 flex items-center">
              <input
                v-model.number="form.numberOfDays"
                type="number"
                min="1"
                class="w-20 px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text text-center"
              />
              <span
                class="ml-2 text-sm text-gray-600 dark:text-dark-text-secondary"
                >Day</span
              >
            </div>
          </div>

          <!-- Row 5: Mission Purpose -->
          <div class="grid grid-cols-1 md:grid-cols-4">
            <div
              class="px-3 py-2 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
            >
              <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                គោលបំណងបេសកម្ម
              </p>
              <p
                class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
              >
                Mission Purpose
              </p>
            </div>
            <div class="px-3 py-2 md:col-span-3">
              <textarea
                v-model="form.missionPurpose"
                rows="2"
                class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text resize-none"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Allowance Table -->
      <div class="mb-6 overflow-x-auto">
        <table
          class="w-full border-collapse border border-gray-200 dark:border-dark-border text-sm"
        >
          <thead>
            <tr>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center bg-gray-50 dark:bg-dark-bg w-1/3"
                rowspan="2"
              >
                <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                  ប្រភេទអន្តរការ
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
                >
                  Type of Allowance
                </p>
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center bg-gray-50 dark:bg-dark-bg text-xs font-medium text-gray-700 dark:text-dark-text-secondary"
                colspan="4"
              >
                ចំនួនទឹកប្រាក់<br />Amount
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center bg-gray-50 dark:bg-dark-bg w-24"
                rowspan="2"
              >
                <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
                  កំណត់សម្គាល់
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
                >
                  Remark
                </p>
              </th>
            </tr>
            <tr>
              <th
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center bg-gray-50 dark:bg-dark-bg text-xs text-gray-600 dark:text-dark-text-secondary"
              >
                ចំនួនថ្ងៃ<br />number of Days
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center bg-gray-50 dark:bg-dark-bg text-xs text-gray-600 dark:text-dark-text-secondary"
              >
                អត្រា<br />Rate
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center bg-gray-50 dark:bg-dark-bg text-xs text-gray-600 dark:text-dark-text-secondary"
              >
                រូបិយប័ណ្ណ<br />CCY
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center bg-gray-50 dark:bg-dark-bg text-xs text-gray-600 dark:text-dark-text-secondary"
              >
                ចំនួនទឹកប្រាក់<br />Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in allowanceRows"
              :key="index"
              class="bg-white dark:bg-dark-bg-secondary"
            >
              <td
                class="border border-gray-200 dark:border-dark-border px-3 py-2"
              >
                <p
                  class="text-xs font-medium text-gray-700 dark:text-dark-text"
                >
                  {{ row.khmerLabel }}
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
                >
                  {{ row.typeEn }}
                </p>
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model.number="row.numberOfDays"
                  type="number"
                  min="0"
                  @change="calculateAmount(row)"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model.number="row.rate"
                  type="number"
                  min="0"
                  step="0.01"
                  @change="calculateAmount(row)"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-right text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <select
                  v-model="row.currency"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
                >
                  <option v-for="ccy in currencies" :key="ccy" :value="ccy">
                    {{ ccy }}
                  </option>
                </select>
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-right font-medium text-gray-900 dark:text-dark-text"
              >
                ${{ row.amount?.toFixed(2) || '-' }}
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model="row.remark"
                  type="text"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
            </tr>
            <!-- Payroll Account & Total row -->
            <tr class="bg-gray-50 dark:bg-dark-bg">
              <td
                class="border border-gray-200 dark:border-dark-border px-3 py-2"
              >
                <p
                  class="text-xs font-medium text-gray-700 dark:text-dark-text"
                >
                  លេខគណនីប្រាក់ខែទទួលបាន
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
                >
                  Payroll Account Number
                </p>
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model="form.payrollAccountNumber"
                  type="text"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-3 py-2 md:col-span-2"
                colspan="2"
              >
                <p
                  class="text-xs font-medium text-gray-700 dark:text-dark-text"
                >
                  សរុបប្រាក់ជំនួយធ្វើដំណើរ
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-dark-text-tertiary mt-0.5"
                >
                  Total Advance Allowance
                </p>
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-right font-bold text-gray-900 dark:text-dark-text"
              >
                ${{ totalAllowance.toFixed(2) }}
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center"
              >
                <span
                  class="text-sm text-gray-500 dark:text-dark-text-secondary"
                  >0</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Remarks -->
      <div
        class="grid grid-cols-1 md:grid-cols-6 gap-0 border border-gray-200 dark:border-dark-border mb-6"
      >
        <div
          class="px-3 py-3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg flex items-center"
        >
          <p class="text-xs text-gray-700 dark:text-dark-text-secondary">
            កំណត់សម្គាល់ផ្សេងៗ<br />
            <span class="text-gray-500 dark:text-dark-text-tertiary"
              >Remarks:</span
            >
          </p>
        </div>
        <div class="md:col-span-5 px-3 py-2 bg-white dark:bg-dark-bg-secondary">
          <textarea
            v-model="form.remarks"
            rows="2"
            class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Signature Section -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-200 dark:border-dark-border p-6 mb-6 bg-white dark:bg-dark-bg-secondary"
      >
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-dark-text mb-8">
            ស្នើដោយ<br />Requested By:
          </p>
          <div class="border-t border-gray-300 dark:border-dark-border pt-2">
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary">
              ឈ្មោះ / Name:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              មុខតំណែង / Position:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              កាលបរិច្ឆេទ / Date:
            </p>
            <input
              type="date"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
          </div>
        </div>

        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-dark-text mb-8">
            ត្រួតពិនិត្យដោយ<br />Checked By:
          </p>
          <div class="border-t border-gray-300 dark:border-dark-border pt-2">
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary">
              ឈ្មោះ / Name:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              មុខតំណែង / Position:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              កាលបរិច្ឆេទ / Date:
            </p>
            <input
              type="date"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
          </div>
        </div>

        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-dark-text mb-8">
            អនុម័តដោយ (ប្រធានផ្នែកពាក់ព័ន្ធ)<br />Approved By: (Respective Chief
            of Division)
          </p>
          <div class="border-t border-gray-300 dark:border-dark-border pt-2">
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary">
              ឈ្មោះ / Name:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              មុខតំណែង / Position:
            </p>
            <input
              type="text"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
            <p class="text-xs text-gray-600 dark:text-dark-text-secondary mt-2">
              កាលបរិច្ឆេទ / Date:
            </p>
            <input
              type="date"
              class="w-full px-2 py-1 text-sm border-0 border-b border-gray-300 dark:border-dark-border bg-transparent text-center text-gray-900 dark:text-dark-text focus:ring-0"
            />
          </div>
        </div>
      </div>

      <!-- Attachments -->
      <div
        v-if="requestId"
        class="mt-6 border-t border-gray-200 dark:border-dark-border pt-4"
      >
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-dark-text mb-3"
        >
          Attachments
        </h3>
        <FileAttachmentUpload
          :request-id="requestId"
          :read-only="!canEdit && !isCurrentApprover"
          @upload="handleUpload"
        >
          <div v-if="attachments.length > 0" class="space-y-2 mt-3">
            <div
              v-for="att in attachments"
              :key="att.id"
              class="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-dark-border"
            >
              <div class="flex items-center gap-2 min-w-0">
                <FileText
                  class="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0"
                />
                <span
                  class="text-sm text-gray-700 dark:text-dark-text-secondary truncate"
                >
                  {{ att.originalName }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {{ (att.size / 1024).toFixed(1) }} KB
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  @click="handleDownload(att.id, att.originalName)"
                >
                  <Download class="h-4 w-4" />
                </button>
                <button
                  v-if="canEdit"
                  type="button"
                  class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  @click="handleDeleteAttachment(att.id)"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </FileAttachmentUpload>
      </div>

      <!-- Submit / Approve / Read-only actions -->
      <div class="flex justify-end gap-3">
        <button
          v-if="canEdit"
          type="button"
          class="px-6 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors"
          @click="router.push('/advances')"
        >
          Cancel
        </button>
        <button
          v-if="canEdit"
          type="button"
          :disabled="isSubmitting"
          class="px-6 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-700 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Saving...' : 'Submit Request' }}
        </button>

        <span
          v-if="!canEdit && !showApproveReject"
          class="px-4 py-2 text-sm text-gray-500 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-bg rounded-lg"
        >
          Read-only view
        </span>
      </div>

      <!-- Success message -->
      <div
        v-if="submitted"
        class="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm text-center"
      >
        Travel allowance request submitted successfully!
      </div>
    </fieldset>

    <!-- Unsaved changes confirmation dialog -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click="cancelLeave"
    >
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl border border-gray-200 dark:border-dark-border w-full max-w-sm mx-4 overflow-hidden"
        @click.stop
      >
        <div class="px-6 py-5">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">
            Unsaved Changes
          </h3>
          <p class="text-sm text-gray-500 dark:text-dark-text-secondary mt-2">
            You have unsaved changes. Do you want to leave this page?
          </p>
        </div>
        <div
          class="px-6 py-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg flex justify-end gap-3"
        >
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors"
            @click="cancelLeave"
          >
            Stay
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            @click="confirmLeave"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
