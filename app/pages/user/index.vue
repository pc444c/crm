<template>
  <div class="p-4 flex flex-col gap-4 min-w-full">
    <div class="flex flex-col xl:flex-row gap-6">
      <div class="flex flex-col gap-6 w-full xl:w-3/4">
        <user-base-info />
        <user-last-calls />
      </div>
      <div class="w-full xl:w-1/4">
        <user-text-script class="h-full" />
      </div>
    </div>
  </div>
</template>

<script setup>
// Импорт всех необходимых компонентов осуществляется автоматически
// благодаря конвенции именования в Nuxt 3
useHead({
  title: "Панель оператора",
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
