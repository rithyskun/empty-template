import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFetchApi } from '@/composables/useFetchApi';
import { fetchRsaPublicKey, encryptWithRsa } from '@/utils/rsaEncrypt';
import type {
  User,
  LoginCredentials,
  TwoFactorCredentials,
  LoginResponse,
} from '../types';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

function loadStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function useAuth() {
  const router = useRouter();

  const user = ref<User | null>(loadStoredUser());
  const isAuthenticated = computed(() => !!user.value);
  const requiresTwoFactor = ref(false);
  const twoFactorMethods = ref<Array<'totp' | 'sms' | 'email'>>([]);
  const tempToken = ref<string | null>(null);
  const pendingApproval = ref(false);
  const error = ref<string | null>(null);
  const loading = ref(false);

  function setSession(u: User, token: string) {
    user.value = u;
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  function clearSession() {
    user.value = null;
    requiresTwoFactor.value = false;
    twoFactorMethods.value = [];
    tempToken.value = null;
    pendingApproval.value = false;
    error.value = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true;
    error.value = null;
    pendingApproval.value = false;
    try {
      const publicKey = await fetchRsaPublicKey();
      let body: Record<string, unknown> = { ...credentials };

      if (publicKey) {
        const encrypted = encryptWithRsa(
          JSON.stringify(credentials),
          publicKey,
        );
        if (encrypted) {
          body = {
            email: 'enc',
            password: 'enc',
            provider: credentials.provider,
            payload: encrypted,
          };
        }
      }

      const { postApi } = useFetchApi();
      const response = await postApi<LoginResponse>('/api/v1/auth/login', body);

      if (response.data.requires2fa) {
        requiresTwoFactor.value = true;
        twoFactorMethods.value = ['email'];
        tempToken.value = response.data.tempToken ?? null;
        await router.push('/verify-2fa');
        return;
      }

      if (response.data.user && response.data.accessToken) {
        setSession(response.data.user, response.data.accessToken);
        await router.push('/');
      }
    } catch (err) {
      const statusCode = (err as Error & { statusCode?: number }).statusCode;
      if (statusCode === 403) {
        pendingApproval.value = true;
        await router.push('/pending-approval');
        return;
      }
      error.value = err instanceof Error ? err.message : 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyTwoFactor(credentials: TwoFactorCredentials) {
    loading.value = true;
    error.value = null;
    try {
      const { postApi } = useFetchApi();
      const response = await postApi<LoginResponse>('/api/v1/auth/2fa/verify', {
        code: credentials.code,
        tempToken: tempToken.value,
      });

      if (response.data.user && response.data.accessToken) {
        setSession(response.data.user, response.data.accessToken);
        requiresTwoFactor.value = false;
        twoFactorMethods.value = [];
        tempToken.value = null;
        await router.push('/');
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : '2FA verification failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    clearSession();
    await router.push('/login');
  }

  async function fetchCurrentUser() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;

    try {
      const { fetchApi } = useFetchApi();
      const currentUser = await fetchApi<User>('/api/v1/auth/me');
      user.value = currentUser.data;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser.data));
    } catch {
      clearSession();
    }
  }

  return {
    user,
    isAuthenticated,
    requiresTwoFactor,
    twoFactorMethods,
    tempToken,
    pendingApproval,
    error,
    loading,
    login,
    verifyTwoFactor,
    logout,
    fetchCurrentUser,
  };
}
