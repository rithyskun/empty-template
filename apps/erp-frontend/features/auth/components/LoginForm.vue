<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { LoginCredentials } from '../types';
import { useAuth } from '../composables/useAuth';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next';

const showPassword = ref(false);

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

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Username -->
    <div>
      <label
        for="email"
        class="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1.5"
      >
        {{ $t('auth.username') }}
      </label>
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <User class="w-5 h-5 text-gray-400" />
        </div>
        <input
          id="email"
          v-model="form.email"
          type="text"
          placeholder="john.doe"
          required
          class="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>
    </div>

    <!-- Password -->
    <div>
      <label
        for="password"
        class="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1.5"
      >
        {{ $t('auth.password') }}
      </label>
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <Lock class="w-5 h-5 text-gray-400" />
        </div>
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your password"
          required
          class="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="showPassword = !showPassword"
        >
          <Eye v-if="showPassword" class="w-5 h-5" />
          <EyeOff v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5"
    >
      <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
      <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading"
      class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
      <span v-if="!loading">{{ $t('auth.signIn') }}</span>
      <span v-else>{{ $t('auth.signingIn') }}</span>
    </button>

    <!-- Provider badge -->
    <div
      class="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500"
    >
      <span class="w-8 h-px bg-gray-200 dark:bg-gray-700" />
      <span>LDAP Authentication</span>
      <span class="w-8 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  </form>
</template>
