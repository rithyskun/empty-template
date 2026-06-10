<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="method" class="block text-sm font-medium text-gray-700">{{
        $t('auth.verificationMethod')
      }}</label>
      <select
        id="method"
        v-model="form.method"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
      >
        <option v-for="m in twoFactorMethods" :key="m" :value="m">
          {{ methodLabel(m) }}
        </option>
      </select>
    </div>

    <div>
      <label for="code" class="block text-sm font-medium text-gray-700">{{
        $t('auth.verificationCode')
      }}</label>
      <input
        id="code"
        v-model="form.code"
        type="text"
        maxlength="6"
        :placeholder="$t('auth.verificationCode')"
        },{
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
      {{ loading ? $t('auth.verifying') : $t('auth.verify') }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TwoFactorCredentials } from '../types';
import { useAuth } from '../composables/useAuth';

const { t } = useI18n();
const { verifyTwoFactor, twoFactorMethods, loading, error } = useAuth();

const form = reactive<TwoFactorCredentials>({
  code: '',
  method: 'totp',
});

function methodLabel(method: string) {
  const labels: Record<string, string> = {
    totp: t('auth.method_totp'),
    sms: t('auth.method_sms'),
    email: t('auth.method_email'),
  };
  return labels[method] ?? method;
}

async function handleSubmit() {
  await verifyTwoFactor(form);
}
</script>
