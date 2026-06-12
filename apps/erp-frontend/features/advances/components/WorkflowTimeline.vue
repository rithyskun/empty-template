<script setup lang="ts">
import { computed } from 'vue';
import {
  User,
  Users,
  Building,
  ClipboardCheck,
  Eye,
  ShieldCheck,
  Circle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from 'lucide-vue-next';

export interface WorkflowStage {
  id: string;
  stageOrder: number;
  stageType: string;
  assignedRole: string;
  status: string;
  comment?: string;
  actedAt?: string;
  actedBy?: string;
  createdAt: string;
}

const props = defineProps<{
  stages: WorkflowStage[];
  currentStage: number;
  instanceStatus: string;
  canAct?: boolean;
}>();

const emit = defineEmits<{
  approve: [];
  reject: [];
}>();

const stepConfig = [
  { label: 'Requester', icon: User, role: 'REQUESTER' },
  { label: 'Line Manager', icon: Users, role: 'LINE_MANAGER' },
  { label: 'VP / Chief', icon: Building, role: 'DEPARTMENT_HEAD' },
  { label: 'Checker', icon: ClipboardCheck, role: 'CHECKER' },
  { label: 'Reviewer', icon: Eye, role: 'TREASURY' },
  { label: 'Authorizer', icon: ShieldCheck, role: 'AUTHORIZER' },
];

const sortedStages = computed(() => {
  return [...props.stages].sort((a, b) => a.stageOrder - b.stageOrder);
});

function getStageStatus(
  order: number,
): 'completed' | 'current' | 'pending' | 'rejected' {
  if (props.instanceStatus === 'REJECTED') {
    const rejectedStage = sortedStages.value.find(
      (s) => s.status === 'REJECTED',
    );
    if (rejectedStage && order <= rejectedStage.stageOrder) {
      if (order === rejectedStage.stageOrder) return 'rejected';
      return 'completed';
    }
    if (order <= props.currentStage) return 'completed';
    return 'pending';
  }

  if (props.instanceStatus === 'COMPLETED') {
    return 'completed';
  }

  if (order < props.currentStage) return 'completed';
  if (order === props.currentStage) return 'current';
  return 'pending';
}

function getStageByOrder(order: number): WorkflowStage | undefined {
  return sortedStages.value.find((s) => s.stageOrder === order);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="mb-6">
    <h3
      class="text-sm font-medium text-gray-500 dark:text-dark-text-secondary mb-3"
    >
      Approval Workflow
    </h3>
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-4"
    >
      <!-- Desktop: horizontal timeline -->
      <div class="hidden md:flex items-center gap-2">
        <template v-for="(step, idx) in stepConfig" :key="idx">
          <div class="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                getStageStatus(idx + 1) === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : getStageStatus(idx + 1) === 'current'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-2 ring-amber-300 dark:ring-amber-700'
                    : getStageStatus(idx + 1) === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
              ]"
            >
              <CheckCircle2
                v-if="getStageStatus(idx + 1) === 'completed'"
                class="w-4.5 h-4.5"
              />
              <XCircle
                v-else-if="getStageStatus(idx + 1) === 'rejected'"
                class="w-4.5 h-4.5"
              />
              <Clock
                v-else-if="getStageStatus(idx + 1) === 'current'"
                class="w-4.5 h-4.5"
              />
              <component :is="step.icon" v-else class="w-4 h-4" />
            </div>
            <span
              :class="[
                'text-[11px] font-medium text-center leading-tight',
                getStageStatus(idx + 1) === 'completed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : getStageStatus(idx + 1) === 'current'
                    ? 'text-amber-600 dark:text-amber-400'
                    : getStageStatus(idx + 1) === 'rejected'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-500',
              ]"
            >
              {{ step.label }}
            </span>
            <span
              v-if="getStageByOrder(idx + 1)?.actedAt"
              class="text-[10px] text-gray-400 dark:text-dark-text-tertiary"
            >
              {{ formatDate(getStageByOrder(idx + 1)?.actedAt) }}
            </span>
          </div>
          <ArrowRight
            v-if="idx < stepConfig.length - 1"
            class="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0"
          />
        </template>
      </div>

      <!-- Mobile: vertical list -->
      <div class="md:hidden space-y-2">
        <div
          v-for="(step, idx) in stepConfig"
          :key="idx"
          class="flex items-center gap-3"
        >
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
              getStageStatus(idx + 1) === 'completed'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : getStageStatus(idx + 1) === 'current'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-2 ring-amber-300 dark:ring-amber-700'
                  : getStageStatus(idx + 1) === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
            ]"
          >
            <CheckCircle2
              v-if="getStageStatus(idx + 1) === 'completed'"
              class="w-3.5 h-3.5"
            />
            <XCircle
              v-else-if="getStageStatus(idx + 1) === 'rejected'"
              class="w-3.5 h-3.5"
            />
            <Clock
              v-else-if="getStageStatus(idx + 1) === 'current'"
              class="w-3.5 h-3.5"
            />
            <component :is="step.icon" v-else class="w-3 h-3" />
          </div>
          <div class="flex-1 min-w-0">
            <p
              :class="[
                'text-sm font-medium',
                getStageStatus(idx + 1) === 'completed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : getStageStatus(idx + 1) === 'current'
                    ? 'text-amber-600 dark:text-amber-400'
                    : getStageStatus(idx + 1) === 'rejected'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-500',
              ]"
            >
              {{ step.label }}
            </p>
            <p
              v-if="getStageByOrder(idx + 1)?.actedAt"
              class="text-xs text-gray-400 dark:text-dark-text-tertiary"
            >
              {{ formatDate(getStageByOrder(idx + 1)?.actedAt) }}
            </p>
          </div>
          <span
            v-if="getStageStatus(idx + 1) === 'current'"
            class="text-xs font-medium text-amber-600 dark:text-amber-400"
          >
            Pending
          </span>
        </div>
      </div>

      <!-- Action buttons for current approver -->
      <div
        v-if="
          canAct &&
          (instanceStatus === 'PENDING' || instanceStatus === 'SUBMITTED')
        "
        class="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/50 flex justify-end gap-3"
      >
        <button
          class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          @click="emit('reject')"
        >
          Reject
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-700 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          @click="emit('approve')"
        >
          Approve
        </button>
      </div>
    </div>
  </div>
</template>
