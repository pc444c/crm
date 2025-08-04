<template>
  <div class="min-w-full flex flex-col gap-4">
    <section class="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <USeparator
        color="primary"
        label="Статистика холодки"
        class="col-span-1 md:col-span-3 mb-4"
      />
      <admin-stat-user-all class="w-full" />
      <admin-stat-user-offline class="w-full" />
      <admin-stat-user-online class="w-full" />
    </section>


    <section class="w-full p-4">
      <USeparator
        color="primary"
        label="Управление глобальными скриптами"
        class="mb-4"
      />
      <AdminGlobalScripts />
    </section>

    <section class="w-full p-4">
      <USeparator color="secondary" label="Шаблоны комментариев" class="mb-4" />
      <AdminCommentTemplates />
    </section>

  </div>
</template>

<script lang="ts" setup>
// Мета-данные страницы
definePageMeta({
  layout: "admin",
});
</script>

<style lang="scss" scoped></style>
