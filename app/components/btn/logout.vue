<template>
  <UButton @click="Logout()" color="error" variant="solid" class="logout-btn">
    <span class="icon">
      <!-- SVG иконка выхода -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
        />
      </svg>
    </span>
    <span>ВЫЙТИ ИЗ АККАУНТА</span>
  </UButton>
</template>

<script lang="ts" setup>
import { useAuthStore } from "~/store/useAuth";
const userAuthStore = useAuthStore();
const toast = useToast();
const Logout = () => {
  userAuthStore.clear();
  window.location.href = "/";
  toast.add({
    title: "Вы вышли из аккаунта",
    color: "success",
  });
};
</script>

<style scoped>
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
  .icon {
    display: flex;
    align-items: center;
  }
}
</style>
