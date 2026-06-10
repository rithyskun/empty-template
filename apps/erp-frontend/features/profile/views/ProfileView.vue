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
  Lock,
  Info,
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

const activeTab = ref<'general' | 'security'>('general');

const tabs = [
  { id: 'general' as const, label: 'General', icon: Info },
  { id: 'security' as const, label: 'Security', icon: Lock },
];

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
  <div class="px-4 sm:px-6 py-6">
    <!-- User Info Card -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-5 sm:p-6 mb-8"
    >
      <div class="flex items-center gap-4 sm:gap-6">
        <img
          :src="avatarUrl"
          :alt="fullName"
          class="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-dark-border-light shrink-0"
        />
        <div class="min-w-0">
          <h2
            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text truncate"
          >
            {{ fullName }}
          </h2>
          <p
            class="text-sm text-gray-500 dark:text-dark-text-tertiary truncate"
          >
            {{ user?.email }}
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <span
              v-for="role in user?.roles"
              :key="role"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
            >
              {{ role }}
            </span>
          </div>
          <div
            class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-tertiary"
          >
            <User class="w-3.5 h-3.5" />
            <span class="font-mono">{{ user?.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-dark-border">
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors rounded-t-lg',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
              : 'border-transparent text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- General Tab -->
    <div v-if="activeTab === 'general'" class="space-y-6">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden"
      >
        <div
          class="px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg-tertiary/50"
        >
          <h3 class="text-base font-semibold text-gray-900 dark:text-dark-text">
            Account Information
          </h3>
        </div>
        <div class="p-5 sm:p-6">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5"
          >
            <div>
              <label
                class="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-text-tertiary mb-1.5"
              >
                First Name
              </label>
              <div
                class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-light text-sm text-gray-900 dark:text-dark-text"
              >
                {{ user?.firstName || '-' }}
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-text-tertiary mb-1.5"
              >
                Last Name
              </label>
              <div
                class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-light text-sm text-gray-900 dark:text-dark-text"
              >
                {{ user?.lastName || '-' }}
              </div>
            </div>
            <div class="sm:col-span-2 xl:col-span-3">
              <label
                class="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-text-tertiary mb-1.5"
              >
                Email Address
              </label>
              <div
                class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-light text-sm text-gray-900 dark:text-dark-text"
              >
                {{ user?.email || '-' }}
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-text-tertiary mb-1.5"
              >
                Account Status
              </label>
              <div
                class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-light text-sm"
              >
                <span
                  class="inline-flex items-center gap-1.5 text-green-700 dark:text-green-300"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"
                  ></span>
                  Active
                </span>
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-text-tertiary mb-1.5"
              >
                User ID
              </label>
              <div
                class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-light text-sm font-mono text-gray-700 dark:text-dark-text-secondary"
              >
                {{ user?.id || '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Tab -->
    <div v-if="activeTab === 'security'" class="space-y-6">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden"
      >
        <div
          class="px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg-tertiary/50 flex items-center gap-3"
        >
          <Shield class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-dark-text">
            Two-Factor Authentication
          </h3>
        </div>
        <div class="p-5 sm:p-6">
          <div v-if="user?.isTwoFactorEnabled" class="space-y-4">
            <div
              class="flex items-center gap-2 text-green-600 dark:text-green-400"
            >
              <ShieldCheck class="w-5 h-5" />
              <span class="font-medium">2FA is enabled on your account</span>
            </div>

            <div class="border-t border-gray-200 dark:border-dark-border pt-4">
              <p
                class="text-sm text-gray-600 dark:text-dark-text-secondary mb-3"
              >
                To disable 2FA, enter the current 6-digit code from your
                authenticator app.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <input
                  v-model="disableCode"
                  type="text"
                  maxlength="6"
                  placeholder="000000"
                  class="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-center tracking-widest font-mono text-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
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
            <div
              class="flex items-center gap-2 text-gray-500 dark:text-dark-text-tertiary"
            >
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
              class="border-t border-gray-200 dark:border-dark-border pt-4 space-y-4"
            >
              <p class="text-sm text-gray-600 dark:text-dark-text-secondary">
                Scan the QR code with your authenticator app (Google
                Authenticator, Authy, etc.), then enter the 6-digit verification
                code below.
              </p>

              <div class="flex flex-col items-center gap-4">
                <img
                  :src="qrCodeUrl"
                  alt="2FA QR Code"
                  class="rounded-lg border border-gray-200 dark:border-dark-border"
                />

                <div
                  class="flex items-center gap-2 bg-gray-100 dark:bg-dark-bg-tertiary rounded-lg px-3 py-2"
                >
                  <span
                    class="font-mono text-sm text-gray-700 dark:text-dark-text-secondary"
                    >{{ secretKey }}</span
                  >
                  <button
                    type="button"
                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-bg-hover text-gray-500 dark:text-dark-text-tertiary"
                    :title="copied ? 'Copied!' : 'Copy secret'"
                    @click="copySecret"
                  >
                    <Check
                      v-if="copied"
                      class="w-4 h-4 text-green-600 dark:text-green-400"
                    />
                    <Copy
                      v-else
                      class="w-4 h-4 text-gray-500 dark:text-dark-text-tertiary"
                    />
                  </button>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <input
                  v-model="verifyCode"
                  type="text"
                  maxlength="6"
                  placeholder="000000"
                  class="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-dark-border-light rounded-lg text-center tracking-widest font-mono text-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
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
                  class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-hover"
                  @click="showSetup = false"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
