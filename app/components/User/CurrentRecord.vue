<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard class="bg-neutral-900 text-white">
      <div class="flex justify-between items-center mb-4">
        <USeparator color="primary" label="Текущая запись" />
        <UButton
          color="primary"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="isLoading"
          :disabled="isLoading"
          @click="fetchCurrentRecord"
        >
          Получить новую запись
        </UButton>
      </div>

      <div v-if="isLoading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="error" class="text-center text-red-500 py-8">
        {{ error }}
      </div>

      <div v-else-if="!currentRecord" class="text-center text-gray-400 py-8">
        Нет доступных записей
      </div>

      <div v-else>
        <!-- Основная информация о записи -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div
            v-for="(field, index) in displayFields"
            :key="index"
            class="flex flex-col"
          >
            <span class="text-gray-400 text-sm mb-1">{{ field.label }}:</span>
            <span class="font-medium">{{
              getFieldValue(field.key) || "Н/Д"
            }}</span>
          </div>
        </div>

        <!-- Тег записи -->
        <div class="mt-4 flex items-center gap-2">
          <span class="text-gray-400 text-sm">Текущий тег:</span>
          <UChip
            v-if="currentRecord.tag && currentRecord.tagInfo"
            :color="
              currentRecord.tagInfo.color || getTagColor(currentRecord.tag)
            "
            :text-color="
              getContrastColor(
                currentRecord.tagInfo?.color || getTagColor(currentRecord.tag)
              )
            "
            variant="solid"
          >
            {{ currentRecord.tag }}
          </UChip>
          <span v-else class="text-gray-400 italic">Не назначен</span>

          <UButton
            color="secondary"
            size="xs"
            icon="i-heroicons-pencil-square"
            @click="showTagSelector = true"
          >
            Изменить тег
          </UButton>
        </div>

        <!-- Дополнительная информация -->
        <div class="mt-6">
          <span class="text-gray-400 text-sm block mb-2"
            >Дополнительная информация:</span
          >
          <p class="whitespace-pre-line">
            {{
              currentRecord.description ||
              "Дополнительная информация отсутствует"
            }}
          </p>
        </div>

        <!-- Метаданные записи -->
        <div class="mt-6 text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
          <div>ID записи: {{ currentRecord.id }}</div>
          <div>Дата создания: {{ formatDate(currentRecord.created_at) }}</div>
          <div v-if="currentRecord.used_at">
            Использована: {{ formatDate(currentRecord.used_at) }}
          </div>
          <div v-if="currentRecord.status_updated_at">
            Статус обновлен: {{ formatDate(currentRecord.status_updated_at) }}
          </div>
        </div>
      </div>
    </UCard>

    <!-- Модальное окно выбора тега -->
    <UModal v-model="showTagSelector">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">Выбор тега для записи</div>
        </template>

        <records-tag-selector
          v-if="currentRecord"
          :record-id="currentRecord.id"
          :current-tag="currentRecord.tag"
          :current-tag-id="currentRecord.tagId"
          @tag-assigned="handleTagAssigned"
        />

        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" @click="showTagSelector = false">
              Закрыть
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/store/useAuth";

const auth = useAuthStore();
const currentRecord = ref(null);
const isLoading = ref(false);
const error = ref(null);
const showTagSelector = ref(false);
const toast = useToast();

// Поля для отображения
const displayFields = [
  { key: "fio", label: "ФИО" },
  { key: "phone", label: "Телефон" },
  { key: "city", label: "Город" },
  { key: "region", label: "Область" },
  { key: "age", label: "Возраст" },
  { key: "address", label: "Адрес" },
  { key: "timezone", label: "Часовой пояс" },
  { key: "custom1", label: "Доп. поле 1" },
  { key: "custom2", label: "Доп. поле 2" },
  { key: "custom3", label: "Доп. поле 3" },
];

// Получить текущую запись
async function fetchCurrentRecord() {
  if (!auth.user) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch("/api/user/getContant", {
      method: "POST",
      body: {
        userId: auth.user.id,
      },
    });

    if (response && response.success && response.record) {
      currentRecord.value = response.record;
    } else {
      error.value = response?.error || "Нет доступных записей";
      if (error.value) {
        toast.add({
          title: "Информация",
          description: error.value,
          color: "yellow",
        });
      }
    }
  } catch (e) {
    console.error("Ошибка при получении записи:", e);
    error.value = e.message || "Ошибка при получении записи";
    toast.add({
      title: "Ошибка",
      description: error.value,
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

// Обработка назначения тега
function handleTagAssigned(tagData) {
  if (currentRecord.value && tagData.recordId === currentRecord.value.id) {
    currentRecord.value.tag = tagData.tagName;
    currentRecord.value.tagId = tagData.tagId;

    if (tagData.tagInfo) {
      currentRecord.value.tagInfo = tagData.tagInfo;
    }

    showTagSelector.value = false;

    toast.add({
      title: "Успешно",
      description: "Тег успешно назначен записи",
      color: "success",
    });
  }
}

// Получить значение поля
function getFieldValue(key) {
  return currentRecord.value ? currentRecord.value[key] : "";
}

// Получить цвет тега
function getTagColor(_tagName) {
  // Здесь можно реализовать получение цвета тега из хранилища тегов
  // Пока возвращаем стандартный цвет
  return "#3B82F6";
}

// Получить контрастный цвет
function getContrastColor(bgColor) {
  if (!bgColor) return "white";

  // Простой алгоритм для определения контрастного цвета
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "black" : "white";
}

// Форматирование даты
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchCurrentRecord();
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
