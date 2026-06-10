<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ $t('auth.twoFactorTitle') }}
      </h1>
      <p class="text-gray-600 mb-6">{{ $t('auth.twoFactorDesc') }}</p>
      <TwoFactorForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import TwoFactorForm from '../components/TwoFactorForm.vue';
</script>
