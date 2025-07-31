<template>
  <div class="p-4 flex flex-col gap-4 min-w-full">
    <div class="flex flex-col gap-6">
      <user-base-info />
      <user-last-calls />
      <user-text-script class="mt-4" />
    </div>
  </div>
</template>

<script setup>
// Импорт всех необходимых компонентов осуществляется автоматически
// благодаря конвенции именования в Nuxt 3
useHead({
  title: 'Панель оператора'
})
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
