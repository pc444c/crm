<template>
  <div class="p-4 flex flex-col gap-4 min-w-full min-h-screen">
    <div class="flex flex-col xl:flex-row gap-6 flex-1">
      <div class="flex flex-col gap-6 w-full xl:w-3/4">
        <user-base-info />
      </div>
      <div class="w-full xl:w-1/4 flex flex-col">
        <user-text-script class="flex-1" />
      </div>
    </div>

    <!-- Список перезвонов внизу -->
    <div class="w-full">
      <user-callback-list @select-callback="loadCallbackRecord" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Импорт всех необходимых компонентов осуществляется автоматически
// благодаря конвенции именования в Nuxt 3
useHead({
  title: "Панель оператора",
});

interface CallbackRecord {
  id: number;
  fio: string;
  phone: string;
  callback_time: string;

  callback_comment?: string;

  description?: string;
}

// Функция для загрузки записи из перезвона
function loadCallbackRecord(callbackRecord: CallbackRecord) {
  // Отправляем событие для загрузки записи в BaseInfo компонент
  window.dispatchEvent(
    new CustomEvent("loadRecord", {
      detail: { recordId: callbackRecord.id },
    })
  );
}
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
