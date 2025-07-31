<template>
  <UCard class="bg-neutral-800 h-full text-white">
    <div class="flex flex-col h-full">
      <USeparator color="primary" label="Скрипты для общения" />
      <p class="text-gray-300 text-sm my-2">
        Нажмите на скрипт, чтобы увидеть полный текст
      </p>

      <div class="flex flex-col gap-2 flex-grow overflow-y-auto">
        <UModal v-for="(i, idx) in scripts" :key="idx" title="Скрипт общения">
          <UButton
            block
            color="secondary"
            size="md"
            class="text-left truncate"
            icon="i-heroicons-document-text"
          >
            {{ i.title }}
          </UButton>

          <template #body>
            <div class="p-4">
              <h3 class="font-bold mb-2">{{ i.title }}</h3>
              <div class="text-gray-700 whitespace-pre-line">
                {{ i.text }}
              </div>

              <div class="mt-4 flex justify-end">
                <UButton
                  color="primary"
                  icon="i-heroicons-clipboard"
                  @click="copyToClipboard(i.text)"
                >
                  Копировать
                </UButton>
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const toast = useToast();

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

// Функция копирования текста в буфер обмена
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Ошибка",
      description: "Не удалось скопировать текст",
      color: "error",
    });
    console.error("Ошибка при копировании:", err);
  }
};
</script>

<style lang="scss" scoped></style>
