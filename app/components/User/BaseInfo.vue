<template>
  <div class="flex flex-col lg:flex-row gap-4 w-full">
    <!-- Левая карточка с кнопками и данными -->
    <UCard class="w-full lg:w-2/3 bg-neutral-800 text-white">
      <div class="flex flex-col gap-6">
        <!-- Панель статуса -->
        <div class="flex flex-wrap gap-2">
          <UTooltip
            v-for="(tag, index) in listtag"
            :key="index"
            :text="tag.about"
          >
            <button
              :style="{ backgroundColor: tag.color }"
              class="p-2 hover:opacity-80 transition-opacity text-white rounded"
              @click="openModal(index)"
            >
              {{ tag.name }}
            </button>
          </UTooltip>
        </div>

        <!-- Разделитель -->
        <USeparator color="primary" label="Основная информация" />

        <!-- Информация -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div
            v-for="(label, index) in dateSpan"
            :key="index"
            class="flex flex-col text-xl"
          >
            <span class="text-gray-400 font-semibold">{{ label }}</span>
            <span class="text-white">{{ dateSpanValues[index] }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Правая карточка с описанием -->
    <UCard class="w-full lg:w-1/3 bg-neutral-800 text-white">
      <USeparator color="primary" label="Коментарий к клиенту" />
      <div class="text-lg whitespace-pre-line leading-relaxed text-gray-200">
        {{ desc }}
      </div>
    </UCard>
  </div>

  <!-- Модальное окно -->
  <UModal v-model:open="isOpen" title="Подтверди статус трубки">
    <template #body>
      <Placeholder class="h-48 m-4" />
      <div class="flex flex-col items-center justify-center">
        <span>Ты точно хочеть выбрать этот статус?</span>
        <button
              :style="{ backgroundColor: ModalData.color }"
              class="p-2 hover:opacity-80 transition-opacity text-white rounded"
            >
              {{ ModalData.name }}
            </button>
      </div>
      <UButton
        class="mt-2 mx-auto w-full"
        icon="clarity:success-line"
        size="xl"
      >
        Да точно
      </UButton>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";

// Данные для кнопок и описания
const isOpen = ref(false); // Состояние для модалки
const listtag = ref([]); // Список тегов
const getTags = async () => {
  try {
    const response = await $fetch("/api/admin/listtags");
    listtag.value = response || [];
    console.log("Теги успешно загружены:", listtag.value);
  } catch (error) {
    console.error("Ошибка при получении тегов:", error);
  }
};

// Информация
const dateSpan = [
  "ФИО:",
  "Номер телефона:",
  "Город:",
  "Область:",
  "Доп поле 1:",
  "Доп поле 2:",
  "Доп поле 3:",
  "Доп инфо:",
];

const dateSpanValues = [
  "Иван Иванов",
  "+79991234567",
  "Москва",
  "Московская область",
  "Пример данных 1",
  "Пример данных 2",
  "Пример данных 3",
  "Дополнительная информация",
];

const desc = `...`; // Описание клиента
const ModalData = ref({}); // Было: ref([])
// Метод для открытия модального окна
const openModal = (index: number) => {
  isOpen.value = true;
  //  добавить данные в ModalData по индексу
  ModalData.value = listtag.value[index] || {};
};
onMounted(() => {
  getTags(); // Загрузка тегов при монтировании компонента
});
</script>

