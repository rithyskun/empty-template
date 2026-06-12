<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Paperclip,
  X,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
} from 'lucide-vue-next';

interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const props = defineProps<{
  requestId?: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  upload: [file: File];
  delete: [attachmentId: string];
  download: [attachmentId: string, fileName: string];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  )
    return FileSpreadsheet;
  return FileText;
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    emit('upload', target.files[0]);
    target.value = '';
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  if (event.dataTransfer?.files[0]) {
    emit('upload', event.dataTransfer.files[0]);
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <div class="space-y-3">
    <!-- Upload zone -->
    <div
      v-if="!readOnly"
      role="button"
      tabindex="0"
      class="border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer"
      :class="[
        isDragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
          : 'border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-500',
      ]"
      @click="triggerFileInput"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp"
        class="hidden"
        @change="onFileChange"
      />
      <Paperclip
        class="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500 mb-1"
      />
      <p class="text-sm text-gray-600 dark:text-dark-text-secondary">
        Click or drag file here
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        PDF, Excel, CSV, Images up to 10MB
      </p>
    </div>

    <!-- File list slot -->
    <slot />
  </div>
</template>
