<template>
  <header
    class="bg-neutral-800 p-2 flex flex-row gap-6 items-center justify-between"
  >
    <div class="flex items-center gap-4">
      <NuxtImg
        src="/logocrm.png"
        alt="Logo"
        width="50"
        height="50"
        class="rounded-full"
      />
      <h2 class="font-bold font-mono text-xl">CRM SYSTEM</h2>
    </div>

    <div class="flex-grow">
      <UNavigationMenu color="primary" :items="items" class="w-full" />
    </div>

    <div v-if="auth.getRole" class="flex items-center gap-2">
      <span class="text-sm text-gray-300">{{ auth.getLogin }}</span>
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="error"
        variant="ghost"
        size="sm"
        @click="handleLogout"
      >
        Выход
      </UButton>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/store/useAuth";

const auth = useAuthStore();
const toast = useToast();

// Определяем пункты меню в зависимости от роли пользователя


// Функция для выхода из системы
async function handleLogout() {
  await auth.logout();
  toast.add({
    title: "Выход выполнен",
    description: "Вы успешно вышли из системы",
    color: "info",
  });
  navigateTo("/");
}
// Nuxt UI components are auto-imported in Nuxt 3
</script>

<style scoped>
/* Дополнительные стили можно добавить здесь */
</style>
