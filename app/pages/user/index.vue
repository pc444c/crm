<template>
  <div class="p-4 flex flex-col gap-4 min-w-full">
    <NuxtLink
      to="/admin/apitd"
      class="text-blue-500 hover:underline mb-4"
      >LINK LINK LINK</NuxtLink>
    <div class="flex flex-col md:flex-row gap-4">
      <user-text-script class="w-full md:w-1/3" />
      <user-base-info class="w-full md:w-2/3" />
    </div>

    <user-last-calls />
  </div>
</template>

<script setup>
// Импорт всех необходимых компонентов осуществляется автоматически
// благодаря конвенции именования в Nuxt 3
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
