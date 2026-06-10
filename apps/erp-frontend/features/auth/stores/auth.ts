import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  function setUser(userData: User | null) {
    user.value = userData;
  }

  return {
    user,
    isAuthenticated,
    setUser,
  };
});
