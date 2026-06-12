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

interface LineItem {
  itemNo: number;
  description: string;
  currency: string;
  amount: number | null;
  remark: string;
}

const currencies = ['USD', 'KHR'];

const today = new Date().toISOString().split('T')[0];

const form = ref({
  requestDate: today,
  requesterName: user.value
    ? `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
    : '',
  requesterPosition: '',
  department: '',
  contactStaffName: '',
  contactStaffPosition: '',
  contactStaffPhone: '',
  expectedSettleDate: '',
  purpose: '',
  accountName: '',
  accountNumber: '',
});

const lineItems = ref<LineItem[]>(
  Array.from({ length: 5 }, (_, i) => ({
    itemNo: i + 1,
    description: '',
    currency: 'USD',
    amount: null,
    remark: '',
  })),
);

const totalAmount = computed(() => {
  return lineItems.value.reduce((sum, item) => sum + (item.amount || 0), 0);
});

function addRow() {
  lineItems.value.push({
    itemNo: lineItems.value.length + 1,
    description: '',
    currency: 'USD',
    amount: null,
    remark: '',
  });
}

function removeRow(index: number) {
  if (lineItems.value.length > 1) {
    lineItems.value.splice(index, 1);
    lineItems.value.forEach((item, i) => (item.itemNo = i + 1));
  }
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
watch(lineItems, markDirty, { deep: true });

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
      employeeId: user.value?.id || '',
      amount: totalAmount.value,
      currency: 'USD',
      items: lineItems.value
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          itemNo: item.itemNo,
          description: item.description,
          currency: item.currency,
          amount: item.amount || 0,
          remark: item.remark,
        })),
    };

    console.log('Submitting advance request:', payload);
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
      This advance request has been rejected.
    </div>
    <div
      v-if="isCompleted"
      class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm text-center font-medium"
    >
      This advance request has been fully approved.
    </div>

    <fieldset :disabled="!canEdit" class="min-w-0 border-0 p-0 m-0">
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-dark-text">
          ADVANCED BANK OF ASIA LIMITED
        </h2>
        <p class="text-base text-gray-700 dark:text-dark-text-secondary">
          ធនាគារអេឌ្វាន
        </p>
        <h3 class="text-lg font-bold text-gray-900 dark:text-dark-text mt-1">
          ADVANCE REQUEST FORM
        </h3>
      </div>

      <!-- Requester Information -->
      <div class="mb-6">
        <div
          class="bg-[#006064] dark:bg-[#004d40] text-white px-4 py-2 font-semibold text-sm rounded-t"
        >
          ក្រុមព័ត៌មានអ្នកស្នើសុំ / Requester Information
        </div>
        <div
          class="border border-t-0 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary p-4 rounded-b"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Row 1 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                លេខយោងវិធស្នើបង់ប្រាក់រំកិល<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Advance Ref No:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  type="text"
                  disabled
                  value="Auto-generated"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-dark-text-tertiary"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                កាលបរិច្ឆេទស្នើសុំ<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Request date :</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.requestDate"
                  type="date"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <!-- Row 2 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                ឈ្មោះ<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Name:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.requesterName"
                  type="text"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                មុខតំណែង<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Position:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.requesterPosition"
                  type="text"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <!-- Row 3 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                ផ្នែក/អង្គភាព<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Division/Department</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.department"
                  type="text"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                បុគ្គលិកទំនាក់ទំនង:<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Contact Staff for advance and settle:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.contactStaffName"
                  type="text"
                  placeholder="Full Name/ Position/ Phone number"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-tertiary"
                />
              </div>
            </div>

            <!-- Row 4 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                កាលបរិច្ឆេទប៉ាន់ស្មាន់សងប្រាក់:<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Expect date to settle:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.expectedSettleDate"
                  type="date"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 items-center md:col-span-1">
              <label
                class="text-xs text-gray-600 dark:text-dark-text-secondary col-span-1"
              >
                គោលបំណង<br />
                <span class="text-gray-500 dark:text-dark-text-tertiary"
                  >Purpose:</span
                >
              </label>
              <div class="col-span-2">
                <input
                  v-model="form.purpose"
                  type="text"
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="mb-6 overflow-x-auto">
        <table
          class="w-full border-collapse border border-gray-200 dark:border-dark-border text-sm"
        >
          <thead>
            <tr class="bg-gray-50 dark:bg-dark-bg">
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center w-12"
              >
                លេខរៀង<br />No
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center"
              >
                ការពិពណ៌នា<br />Description
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center w-20"
              >
                រូបិយប័ណ្ណ<br />CCY
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center w-32"
              >
                ចំនួនទឹកប្រាក់<br />Amount
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center w-32"
              >
                កំណត់សម្គាល់<br />Remark
              </th>
              <th
                class="border border-gray-200 dark:border-dark-border px-2 py-2 text-center w-10"
              ></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in lineItems"
              :key="index"
              class="bg-white dark:bg-dark-bg-secondary"
            >
              <td
                class="border border-gray-200 dark:border-dark-border px-3 py-2 text-center text-gray-700 dark:text-dark-text-secondary"
              >
                {{ item.itemNo }}
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model="item.description"
                  type="text"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <select
                  v-model="item.currency"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-dark-text focus:ring-0"
                >
                  <option v-for="ccy in currencies" :key="ccy" :value="ccy">
                    {{ ccy }}
                  </option>
                </select>
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model.number="item.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-right text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1"
              >
                <input
                  v-model="item.remark"
                  type="text"
                  class="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-dark-text focus:ring-0"
                />
              </td>
              <td
                class="border border-gray-200 dark:border-dark-border px-2 py-1 text-center"
              >
                <button
                  v-if="lineItems.length > 1"
                  type="button"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                  @click="removeRow(index)"
                >
                  &times;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          class="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          @click="addRow"
        >
          + Add Row
        </button>
      </div>

      <!-- Total & Account Info -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-200 dark:border-dark-border mb-6"
      >
        <div
          class="border-b md:border-b-0 md:border-r border-gray-200 dark:border-dark-border p-4 bg-white dark:bg-dark-bg-secondary"
        >
          <div class="grid grid-cols-2 gap-4 items-center">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-dark-text">
                សរុបចំនួនទឹកប្រាក់ស្នើ
              </p>
              <p class="text-xs text-gray-500 dark:text-dark-text-secondary">
                Total Advance :
              </p>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold text-gray-900 dark:text-dark-text"
                >${{ totalAmount.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <div>
                <label
                  class="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary"
                >
                  ឈ្មោះគណនី<br />Account Name :
                </label>
                <input
                  v-model="form.accountName"
                  type="text"
                  class="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary"
                >
                  លេខគណនី<br />Account Number:
                </label>
                <input
                  v-model="form.accountNumber"
                  type="text"
                  class="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>
          </div>
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
            អនុម័តដោយ<br />Approved By:
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
        Advance request submitted successfully!
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
