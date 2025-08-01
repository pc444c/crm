<template>
  <div class="flex flex-col lg:flex-row gap-4 w-full">
    <!-- Левая карточка           <UButton
          v-if="currentRecord"
          size="xs"
          color="primary"
          icon="i-heroicons-pencil-square"
          :disabled="!currentRecord"
          @click="editingComment = true"
        >ми и данными -->
    <UCard class="w-full lg:w-2/3 bg-neutral-800 text-white">
      <div class="flex flex-col gap-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-semibold">Текущая запись</h3>
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl" />
        </div>

        <div v-else-if="!currentRecord" class="text-center py-8">
          <p class="text-gray-400 mb-4">Нет доступных записей</p>
        </div>

        <template v-else>
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
                :disabled="isUpdatingTag"
                @click="selectTag(tag)"
              >
                {{ tag.name }}
              </button>
            </UTooltip>

            <!-- Кнопка Перезвон -->
            <UButton
              color="warning"
              icon="i-heroicons-phone"
              :disabled="isUpdatingTag || !currentRecord"
              @click="showCallbackModal = true"
            >
              Перезвон
            </UButton>
          </div>

          <!-- Разделитель -->
          <USeparator color="primary" label="Основная информация" />

          <!-- Информация о текущей записи -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div
              v-for="(field, index) in displayFields"
              :key="index"
              class="flex flex-col text-xl"
            >
              <span class="text-gray-400 font-semibold"
                >{{ field.label }}:</span
              >
              <span class="text-white">{{
                getFieldValue(field.key) || "Н/Д"
              }}</span>
            </div>
          </div>
        </template>
      </div>
    </UCard>

    <!-- Правая карточка с описанием -->
    <UCard class="w-full lg:w-1/3 bg-neutral-800 text-white">
      <div class="flex justify-between items-center">
        <USeparator color="primary" label="Комментарий к клиенту" />
        <UButton
          v-if="currentRecord"
          size="xs"
          color="primary"
          icon="i-heroicons-pencil-square"
          :disabled="!currentRecord"
          @click="editingComment = true"
        >
          Редактировать
        </UButton>
      </div>

      <div v-if="!currentRecord" class="text-center text-gray-400 py-8">
        Нет активной записи
      </div>

      <template v-else>
        <div
          v-if="!editingComment"
          class="text-lg whitespace-pre-line leading-relaxed text-gray-200 mt-4"
        >
          {{ currentRecord.description || "Комментарий отсутствует" }}
        </div>

        <div v-else class="mt-4">
          <UTextarea
            v-model="commentText"
            placeholder="Введите комментарий к клиенту"
            :rows="6"
            class="w-full"
          />

          <div class="flex justify-end gap-2 mt-4">
            <UButton size="sm" color="neutral" @click="cancelEditComment"
              >Отмена</UButton
            >
            <UButton
              size="sm"
              color="primary"
              :loading="isSavingComment"
              @click="saveComment"
            >
              Сохранить
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </div>

  <!-- Модальное окно для перезвона -->
  <UModal v-model:open="showCallbackModal" title="Назначить перезвон">
    <template #body>
      <div class="p-4">
        <div class="flex flex-col gap-4">
          <div class="text-lg font-medium">
            Назначить перезвон для: {{ currentRecord?.fio || "Не указано" }}
          </div>

          <div class="text-sm text-gray-600">
            Телефон: {{ currentRecord?.phone || "Не указан" }}
          </div>

          <UFormField label="Дата и время перезвона">
            <UInput
              v-model="callbackDateTime"
              type="datetime-local"
              :min="minDateTime"
              icon="i-heroicons-calendar"
            />
          </UFormField>

          <UFormField label="Комментарий (необязательно)">
            <UTextarea
              v-model="callbackComment"
              placeholder="Дополнительная информация для перезвона..."
              :rows="3"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <UButton color="neutral" @click="showCallbackModal = false">
            Отмена
          </UButton>
          <UButton
            color="warning"
            icon="i-heroicons-phone"
            :loading="isSettingCallback"
            :disabled="!callbackDateTime"
            @click="setCallback"
          >
            Назначить перезвон
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "~/store/useAuth";

const auth = useAuthStore();
const toast = useToast();

interface Tag {
  id: number;
  name: string;
  about?: string;
  color: string;
}

interface ApiResponse {
  success: boolean;
  record?: Record;
  error?: string;
}

interface Record {
  id: number;
  fio?: string;
  phone?: string;
  city?: string;
  region?: string;
  address?: string;
  age?: string;
  custom1?: string;
  custom2?: string;
  custom3?: string;
  description?: string;
  tag?: string;
  tagInfo?: {
    id: number;
    name: string;
    color: string;
  };
  callback_time?: string;
  [key: string]: unknown;
}

// Состояния
const isLoading = ref(false);
const isUpdatingTag = ref(false);
const currentRecord = ref<Record | null>(null);
const listtag = ref<Tag[]>([]);
const editingComment = ref(false);
const commentText = ref("");
const isSavingComment = ref(false);
const showCallbackModal = ref(false);
const isSettingCallback = ref(false);
const callbackDateTime = ref("");
const callbackComment = ref("");
const noMoreRecords = ref(false);
const recordEndMessage = ref("");
const isEditingComment = ref(false);

// Ссылка на обработчик события для правильной очистки
const loadRecordHandler = ref<((event: Event) => void) | null>(null);

// Минимальное время для перезвона (текущее время + 5 минут)
const minDateTime = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now.toISOString().slice(0, 16);
});

// Поля для отображения
const displayFields = [
  { key: "fio", label: "ФИО" },
  { key: "phone", label: "Телефон" },
  { key: "city", label: "Город" },
  { key: "region", label: "Область" },
  { key: "address", label: "Адрес" },
  { key: "age", label: "Возраст" },
  { key: "custom1", label: "Доп. поле 1" },
  { key: "custom2", label: "Доп. поле 2" },
  { key: "custom3", label: "Доп. поле 3" },
];

// Получить значение поля
const getFieldValue = (key: string) => {
  return currentRecord.value ? currentRecord.value[key] : "";
};

// Загрузка списка тегов
const getTags = async () => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!auth.isAuthenticated) return;

  try {
    const response = (await $fetch("/api/tags/list")) as unknown;

    if (response && Array.isArray(response)) {
      listtag.value = (response as unknown[]).map((tag: unknown) => {
        const tagData = tag as Record<string, unknown>;
        return {
          id: tagData.id as number,
          name: tagData.name as string,
          about: (tagData.about as string) || "",
          color: tagData.color as string,
        };
      });
    } else {
      throw new Error("Не удалось загрузить теги");
    }
  } catch (error: unknown) {
    console.error("Ошибка при загрузке тегов:", error);

    const errorData = error as { data?: { code?: string } };
    if (errorData.data && errorData.data.code === "USER_NOT_EXISTS") {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить теги",
      color: "error",
    });
  }
};

// Получить текущую запись
const fetchRecord = async () => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!auth.getId || !auth.isAuthenticated) return;

  isLoading.value = true;
  console.log("Запрашиваем запись для пользователя ID:", auth.getId);

  try {
    const response = (await $fetch("/api/user/getContant", {
      method: "POST",
      body: {
        userId: auth.getId,
      },
    })) as ApiResponse;

    if (response.success && "record" in response && response.record) {
      currentRecord.value = response.record;
      commentText.value = response.record.description || "";

      toast.add({
        title: "Успешно",
        description: "Запись загружена",
        color: "success",
      });
    } else {
      toast.add({
        title: "Информация",
        description:
          response && "error" in response && response.error
            ? response.error
            : "БАЗА ЗАКОНЧИЛАСЬ",
        color: "warning",
      });
      currentRecord.value = null;
    }
  } catch (error) {
    console.error("Ошибка при получении записи:", error);

    // Проверка на ошибку USER_NOT_EXISTS
    if (
      error.data &&
      (error.data.code === "USER_NOT_EXISTS" ||
        error.data.data?.errorCode === "USER_NOT_EXISTS")
    ) {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: "Не удалось получить запись",
      color: "error",
    });
    currentRecord.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Загрузить конкретную запись по ID
const loadSpecificRecord = async (recordId: number) => {
  try {
    isLoading.value = true;
    console.log("Загружаем запись с ID:", recordId);

    const response = (await $fetch(`/api/user/getRecordById`, {
      query: { id: recordId },
    })) as { status: string; record?: Record; message?: string };

    console.log("Ответ от API:", response);

    if (response.status === "success" && response.record) {
      currentRecord.value = response.record;
      commentText.value = response.record.description || "";
      isEditingComment.value = false;

      toast.add({
        title: "Успешно",
        description: "Запись загружена из перезвонов",
        color: "success",
      });
    } else {
      noMoreRecords.value = true;
      recordEndMessage.value = response.message || "Запись не найдена";

      toast.add({
        title: "Ошибка",
        description: response.message || "Запись не найдена",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Ошибка загрузки записи:", error);
    recordEndMessage.value = "Ошибка загрузки записи";
    noMoreRecords.value = true;

    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить запись",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

// Выбор и назначение тега сразу без подтверждения
const selectTag = async (tag: Tag) => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!currentRecord.value || !tag.name || !auth.isAuthenticated) return;

  isUpdatingTag.value = true;

  try {
    // Назначаем тег записи
    const response = await $fetch("/api/records/setTag", {
      method: "POST",
      body: {
        recordId: currentRecord.value.id,
        tagId: tag.id,
      },
    });

    if (response && response.status === "success") {
      // Обновляем текущую запись с новым тегом
      currentRecord.value.tag = tag.name;
      currentRecord.value.tagInfo = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      };

      toast.add({
        title: "Успешно",
        description: "Тег успешно назначен",
        color: "success",
      });

      // Обновляем список звонков через событие
      window.dispatchEvent(new CustomEvent("call-list-updated"));

      // После назначения тега автоматически загружаем следующую запись
      await fetchRecord();
    } else {
      throw new Error(response?.message || "Не удалось назначить тег");
    }
  } catch (error) {
    console.error("Ошибка при назначении тега:", error);

    // Проверка на ошибку USER_NOT_EXISTS
    if (
      error.data &&
      (error.data.code === "USER_NOT_EXISTS" ||
        error.data.data?.errorCode === "USER_NOT_EXISTS")
    ) {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось назначить тег",
      color: "error",
    });
  } finally {
    isUpdatingTag.value = false;
  }
};

// Назначение перезвона
const setCallback = async () => {
  if (!currentRecord.value || !callbackDateTime.value) return;

  await auth.checkAuth();
  if (!auth.isAuthenticated) return;

  isSettingCallback.value = true;

  try {
    // Ищем тег "ПЕРЕЗВОН"
    const callbackTag = listtag.value.find((tag) => tag.name === "ПЕРЕЗВОН");

    if (!callbackTag) {
      throw new Error("Тег 'ПЕРЕЗВОН' не найден");
    }

    // Назначаем тег и устанавливаем время перезвона
    const response = await $fetch("/api/records/setCallback", {
      method: "POST",
      body: {
        recordId: currentRecord.value.id,
        tagId: callbackTag.id,
        callbackTime: callbackDateTime.value,
        comment: callbackComment.value || null,
      },
    });

    if (response && response.status === "success") {
      // Обновляем текущую запись
      currentRecord.value.tag = "ПЕРЕЗВОН";
      currentRecord.value.callback_time = callbackDateTime.value;
      if (callbackComment.value) {
        currentRecord.value.description = callbackComment.value;
      }

      toast.add({
        title: "Успешно",
        description: "Перезвон назначен",
        color: "success",
      });

      // Закрываем модальное окно и сбрасываем форму
      showCallbackModal.value = false;
      callbackDateTime.value = "";
      callbackComment.value = "";

      // Обновляем список звонков
      window.dispatchEvent(new CustomEvent("call-list-updated"));

      // Загружаем следующую запись
      await fetchRecord();
    } else {
      throw new Error(response?.message || "Не удалось назначить перезвон");
    }
  } catch (error) {
    console.error("Ошибка при назначении перезвона:", error);

    if (
      error.data &&
      (error.data.code === "USER_NOT_EXISTS" ||
        error.data.data?.errorCode === "USER_NOT_EXISTS")
    ) {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось назначить перезвон",
      color: "error",
    });
  } finally {
    isSettingCallback.value = false;
  }
};

// Редактирование комментария
const cancelEditComment = () => {
  editingComment.value = false;
  commentText.value = currentRecord.value?.description || "";
};

// Сохранение комментария
const saveComment = async () => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!currentRecord.value || !auth.isAuthenticated) return;

  isSavingComment.value = true;

  try {
    const response = await $fetch("/api/user/updateComment", {
      method: "POST",
      body: {
        recordId: currentRecord.value.id,
        comment: commentText.value,
      },
    });

    if (response && response.status === "success") {
      // Обновляем локальное значение
      currentRecord.value.description = commentText.value;
      editingComment.value = false;

      toast.add({
        title: "Успешно",
        description: "Комментарий сохранен",
        color: "success",
      });
    } else {
      throw new Error(response?.message || "Не удалось сохранить комментарий");
    }
  } catch (error) {
    console.error("Ошибка при сохранении комментария:", error);

    // Проверка на ошибку USER_NOT_EXISTS
    if (
      error.data &&
      (error.data.code === "USER_NOT_EXISTS" ||
        error.data.data?.errorCode === "USER_NOT_EXISTS")
    ) {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось сохранить комментарий",
      color: "error",
    });
  } finally {
    isSavingComment.value = false;
  }
};

// Инициализация компонента
onMounted(async () => {
  // Сначала проверяем аутентификацию
  await auth.checkAuth();

  // Если пользователь не существует, middleware автоматически перенаправит на страницу входа
  // Если все в порядке, продолжаем инициализацию
  if (auth.isAuthenticated) {
    getTags();
    // Автоматически загружаем запись при монтировании
    fetchRecord();
  }

  // Обработчик для загрузки конкретной записи
  const handleLoadRecord = (event: Event) => {
    const customEvent = event as CustomEvent;
    const recordId = customEvent.detail?.recordId;
    console.log("Получено событие loadRecord с recordId:", recordId);
    if (recordId) {
      loadSpecificRecord(recordId);
    }
  };

  window.addEventListener("loadRecord", handleLoadRecord);
  loadRecordHandler.value = handleLoadRecord;
});

onUnmounted(() => {
  // Правильно очищаем обработчик события
  if (loadRecordHandler.value) {
    window.removeEventListener("loadRecord", loadRecordHandler.value);
    loadRecordHandler.value = null;
  }
});
</script>
