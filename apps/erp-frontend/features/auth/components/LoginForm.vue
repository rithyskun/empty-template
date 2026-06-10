<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">
        {{ $t('auth.username') }}
      </label>
      <input
        id="email"
        v-model="form.email"
        type="text"
        placeholder="john.doe"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
      />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">{{
        $t('auth.password')
      }}</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        placeholder="••••••••"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
      />
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <button
      type="submit"
      :disabled="loading"
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {{ loading ? $t('auth.signingIn') : $t('auth.signIn') }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { LoginCredentials } from '../types';
import { useAuth } from '../composables/useAuth';

const form = reactive<LoginCredentials>({
  email: '',
  password: '',
  provider: 'ldap',
});

const { login, loading, error } = useAuth();

async function handleSubmit() {
  await login(form);
}
</script>
