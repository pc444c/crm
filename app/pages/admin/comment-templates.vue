<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Шаблоны комментариев
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Создавайте и управляйте шаблонами комментариев для быстрого
        использования
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <!-- Компонент управления шаблонами комментариев -->
      <AdminCommentTemplates />
    </div>
  </div>
</template>

<script lang="ts" setup>
// Мета-данные страницы
definePageMeta({
  layout: "admin",
  title: "Шаблоны комментариев - Админ панель",
});

// SEO
useSeoMeta({
  title: "Шаблоны комментариев",
  description: "Управление шаблонами комментариев для CRM системы",
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
