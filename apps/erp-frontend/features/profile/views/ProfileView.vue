<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
} from 'lucide-vue-next';
import { useAuth } from '@features/auth/composables/useAuth';
import { useFetchApi } from '@/composables/useFetchApi';
import { useToast } from '@/composables/useToast';

const { user } = useAuth();
const api = useFetchApi();
const toast = useToast();

const isLoading = ref(false);
const isEnabling = ref(false);
const isDisabling = ref(false);
const showSetup = ref(false);
const qrCodeUrl = ref('');
const secretKey = ref('');
const verifyCode = ref('');
const disableCode = ref('');
const copied = ref(false);

const fullName = computed(() => {
  if (!user.value) return '';
  return `${user.value.firstName} ${user.value.lastName}`.trim();
});

const initials = computed(() => {
  if (!user.value) return 'U';
  const first = user.value.firstName?.charAt(0) ?? '';
  const last = user.value.lastName?.charAt(0) ?? '';
  return (
    `${first}${last}`.toUpperCase() || user.value.email.charAt(0).toUpperCase()
  );
});

const avatarUrl = computed(() => {
  if (!user.value) return '';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.value)}&background=3b82f6&color=fff&size=128`;
});

async function start2faSetup() {
  isLoading.value = true;
  try {
    const response = await api.fetchApi<{ secret: string; otpAuthUrl: string }>(
      '/auth/2fa/generate',
    );
    secretKey.value = response.data.secret;
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.data.otpAuthUrl)}`;
    showSetup.value = true;
  } catch (err: any) {
    toast.error(err?.message || 'Failed to generate 2FA setup');
  } finally {
    isLoading.value = false;
  }
}

async function enable2fa() {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    toast.error('Please enter a valid 6-digit code');
    return;
  }
  isEnabling.value = true;
  try {
    await api.postApi('/auth/2fa/enable', {
      secret: secretKey.value,
      code: verifyCode.value,
    });
    if (user.value) {
      user.value.isTwoFactorEnabled = true;
    }
    showSetup.value = false;
    verifyCode.value = '';
    toast.success('Two-factor authentication enabled successfully');
  } catch (err: any) {
    toast.error(err?.message || 'Invalid verification code');
  } finally {
    isEnabling.value = false;
  }
}

async function disable2fa() {
  if (!disableCode.value || disableCode.value.length !== 6) {
    toast.error('Please enter a valid 6-digit code');
    return;
  }
  isDisabling.value = true;
  try {
    await api.postApi('/auth/2fa/disable', {
      code: disableCode.value,
    });
    if (user.value) {
      user.value.isTwoFactorEnabled = false;
    }
    disableCode.value = '';
    toast.success('Two-factor authentication disabled');
  } catch (err: any) {
    toast.error(err?.message || 'Invalid verification code');
  } finally {
    isDisabling.value = false;
  }
}

function copySecret() {
  navigator.clipboard.writeText(secretKey.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Profile Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        My Profile
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Manage your account and security settings
      </p>
    </div>

    <!-- User Info Card -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6"
    >
      <div class="flex items-start gap-6">
        <img
          :src="avatarUrl"
          :alt="fullName"
          class="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-600"
        />
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ fullName }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="role in user?.roles"
              :key="role"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
            >
              {{ role }}
            </span>
          </div>
          <div
            class="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <User class="w-4 h-4" />
            <span>ID: {{ user?.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Security / 2FA Section -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center gap-3 mb-4">
        <Shield class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h3>
      </div>

      <div v-if="user?.isTwoFactorEnabled" class="space-y-4">
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <ShieldCheck class="w-5 h-5" />
          <span class="font-medium">2FA is enabled on your account</span>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            To disable 2FA, enter the current 6-digit code from your
            authenticator app.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="disableCode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              class="btn-danger inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              :disabled="isDisabling"
              @click="disable2fa"
            >
              <Loader2 v-if="isDisabling" class="w-4 h-4 animate-spin" />
              <ShieldAlert v-else class="w-4 h-4" />
              Disable 2FA
            </button>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <ShieldAlert class="w-5 h-5" />
          <span
            >2FA is not enabled. Add an extra layer of security to your
            account.</span
          >
        </div>

        <button
          v-if="!showSetup"
          type="button"
          class="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
          :disabled="isLoading"
          @click="start2faSetup"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <Shield v-else class="w-4 h-4" />
          Enable 2FA
        </button>

        <!-- 2FA Setup Flow -->
        <div
          v-if="showSetup"
          class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Scan the QR code with your authenticator app (Google Authenticator,
            Authy, etc.), then enter the 6-digit verification code below.
          </p>

          <div class="flex flex-col items-center gap-4">
            <img
              :src="qrCodeUrl"
              alt="2FA QR Code"
              class="rounded-lg border border-gray-200 dark:border-gray-700"
            />

            <div
              class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2"
            >
              <span
                class="font-mono text-sm text-gray-700 dark:text-gray-300"
                >{{ secretKey }}</span
              >
              <button
                type="button"
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                :title="copied ? 'Copied!' : 'Copy secret'"
                @click="copySecret"
              >
                <Check v-if="copied" class="w-4 h-4 text-green-600" />
                <Copy v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="verifyCode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center tracking-widest font-mono text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              class="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              :disabled="isEnabling"
              @click="enable2fa"
            >
              <Loader2 v-if="isEnabling" class="w-4 h-4 animate-spin" />
              <ShieldCheck v-else class="w-4 h-4" />
              Verify & Enable
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="showSetup = false"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
