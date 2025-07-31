<template>
  <UCard>
    <USlideover
      :title="`Скрипт: ${ScriptNow ? ScriptNow.title : 'Выберите скрипт'}`"
      v-for="script in scripts"
      :key="script.title"
    >
      <u-button
        class="w-full mb-2"
        size="xl"
        color="secondary"
        icon="i-heroicons-chat-bubble-left-right"
        @click="checkInfo(script)"
      >
        {{ script.title }}
      </u-button>
      <template #body>
        <Placeholder class="h-full m-4" />
        <span class="text-gray-100 px-4 py-2 rounded block bg-neutral-900">
          {{ ScriptNow ? ScriptNow.text : "Выберите скрипт для просмотра" }}
        </span>
      </template>
    </USlideover>
  </UCard>
</template>

<script lang="ts" setup>
const ScriptNow = ref(null);
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
const checkInfo = (script) => {
  ScriptNow.value = script;
  // Здесь можно добавить логику для обработки текста скрипта
  // Например, вставить текст в активное поле ввода
  console.log("Текст скрипта:", script.text);
};
</script>

<style lang="scss" scoped></style>
