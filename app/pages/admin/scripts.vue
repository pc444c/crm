<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Управление глобальными скриптами
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Создавайте и управляйте скриптами, которые будут доступны всем
        пользователям системы
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <!-- Компонент управления глобальными скриптами -->
      <AdminGlobalScripts />
    </div>
  </div>
</template>

<script lang="ts" setup>
// Мета-данные страницы
definePageMeta({
  layout: "admin",
  title: "Глобальные скрипты - Админ панель",
});

// SEO
useSeoMeta({
  title: "Глобальные скрипты",
  description:
    "Управление глобальными скриптами для всех пользователей CRM системы",
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
