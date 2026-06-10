<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
      <div
        class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4"
      >
        <svg
          class="h-6 w-6 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ $t('auth.pendingApprovalTitle') }}
      </h1>
      <p class="text-gray-600 mb-6">
        {{ $t('auth.pendingApprovalDesc') }}
      </p>
      <div class="bg-gray-50 rounded-md p-4 mb-6 text-left">
        <h3 class="text-sm font-medium text-gray-900 mb-2">
          {{ $t('auth.pendingApprovalNext') }}
        </h3>
        <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>{{ $t('auth.pendingApprovalItem1') }}</li>
          <li>{{ $t('auth.pendingApprovalItem2') }}</li>
          <li>{{ $t('auth.pendingApprovalItem3') }}</li>
        </ul>
      </div>
      <button
        @click="goToLogin"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ $t('auth.backToLogin') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToLogin() {
  router.push('/login');
}
</script>
