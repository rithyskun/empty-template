<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ $t('auth.signIn') }}
      </h1>
      <p class="text-gray-600 mb-6">
        Enter your credentials to access your account.
      </p>
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue';
</script>
