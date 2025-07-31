<template>
  <article class="bg-neutral-800 rounded-lg p-4 flex flex-col gap-4">
    <USeparator color="primary" label="Скрипты" />
    <span>Выберите скрипты для быстрого общения</span>
    <div class="flex flex-col gap-2">
     
      <UModal title="Описание скрипта" v-for="(i, idx) in scripts"
        :key="idx">
        <UButton
        color="secondary"
        size="xl"
        icon="line-md:chevron-double-right"
        >{{ i.title }}</UButton
      >

        <template #body>
          <Placeholder class="h-48"  />
          <span>
            {{ i.text }}
          </span>
        </template>
      </UModal>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const scripts = ref([
  { title: "Приветствие", text: "Здравствуйте, чем могу помочь?" },
  { title: "Прощание", text: "Спасибо за обращение, до свидания!" },
  { title: "Уточнение", text: "Могли бы вы уточнить ваш вопрос?" },
  { title: "Ожидание", text: "Пожалуйста, подождите минуту." },
  { title: "Извинение", text: "Извините за неудобства." },
  { title: "Подтверждение", text: "Ваш запрос принят в работу." },
  { title: "Информация", text: "Вот нужная вам информация." },
  { title: "Передача", text: "Передаю ваш вопрос специалисту." },
  { title: "Обратная связь", text: "Будем рады вашему отзыву." },
  { title: "Контакты", text: "Наши контакты: 123-456-7890." },
]);
</script>

<style lang="scss" scoped></style>
