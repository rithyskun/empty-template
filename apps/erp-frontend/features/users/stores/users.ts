import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserListItem } from '../types';

export const useUsersStore = defineStore('users', () => {
  const selectedUser = ref<UserListItem | null>(null);

  function setSelectedUser(user: UserListItem | null) {
    selectedUser.value = user;
  }

  return {
    selectedUser,
    setSelectedUser,
  };
});
