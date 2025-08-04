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

          <!-- Информация о телефоне и быстрые действия -->
          <div
            v-if="currentRecord?.phone"
            class="bg-neutral-700 p-4 rounded-lg"
          >
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold text-blue-400">
                  📞 Телефон и контакты
                </h4>
                <div class="text-sm text-gray-400">
                  {{ phoneRegion?.region }}
                  <span v-if="phoneRegion?.operator" class="text-blue-400">
                    ({{ phoneRegion.operator }})
                  </span>
                </div>
              </div>

              <div class="text-xl font-mono text-white">
                {{ formattedPhone }}
              </div>

              <!-- Кнопки для звонков и сообщений -->
              <div class="flex flex-wrap gap-2">
                <!-- MicroSIP -->
                <UButton
                  color="primary"
                  icon="i-heroicons-phone-solid"
                  size="sm"
                  :to="microsipLink"
                  external
                  target="_blank"
                >
                  MicroSIP
                </UButton>

                <!-- WhatsApp -->
                <UButton
                  color="success"
                  icon="i-heroicons-chat-bubble-left-right"
                  size="sm"
                  :to="whatsappLink"
                  external
                  target="_blank"
                >
                  WhatsApp
                </UButton>

                <!-- Viber -->
                <UButton
                  color="secondary"
                  icon="i-heroicons-chat-bubble-oval-left-ellipsis"
                  size="sm"
                  :to="viberLink"
                  external
                  target="_blank"
                >
                  Viber
                </UButton>

                <!-- Копировать номер -->
                <UButton
                  color="neutral"
                  icon="i-heroicons-clipboard"
                  size="sm"
                  @click="copyPhone"
                >
                  Копировать
                </UButton>
              </div>
            </div>
          </div>

          <!-- Разделитель -->
          <USeparator color="primary" label="Основная информация" />

          <!-- Информация о перезвоне (если есть) -->
          <div
            v-if="
              currentRecord?.tag === 'ПЕРЕЗВОН' && currentRecord?.callback_time
            "
            class="bg-orange-900/30 border border-orange-600 p-4 rounded-lg mb-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-phone" class="text-orange-400" />
              <h4 class="text-lg font-semibold text-orange-400">
                Информация о перезвоне
              </h4>
            </div>

            <div class="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span class="text-gray-400">Время перезвона:</span>
                <span class="text-white ml-2 font-mono">
                  {{ formatCallbackTime(currentRecord.callback_time) }}
                </span>
              </div>

              <div v-if="currentRecord.callback_comment" class="mt-2">
                <span class="text-gray-400">Причина перезвона:</span>
                <div
                  class="text-white mt-1 p-2 bg-orange-900/20 rounded border-l-2 border-orange-500"
                >
                  {{ currentRecord.callback_comment }}
                </div>
              </div>
            </div>
          </div>

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
      </div>

      <div v-if="!currentRecord" class="text-center text-gray-400 py-8">
        Нет активной записи
      </div>

      <template v-else>
        <div class="flex flex-col h-full w-full">
          <!-- Замена Toast UI Editor на textarea -->
          <UTextarea
            v-model="commentText"
            class="flex-1 h-full w-full min-h-[300px]"
            style="height: 100% !important; resize: none"
            placeholder="Комментарий к клиенту..."
            :rows="16"
            :ui="{
              base: 'w-full h-full',
            }"
          />

          <!-- Убираем кнопку "Сохранить" - комментарий сохраняется автоматически при назначении тега -->
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

          <UFormField
            label="Комментарий к перезвону (отдельно от основного комментария)"
          >
            <UTextarea
              v-model="callbackComment"
              placeholder="Причина перезвона, дополнительная информация..."
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
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuthStore } from "~/store/useAuth";
import { getPhoneRegion, formatPhoneNumber } from "~/utils/phoneRegions";

const auth = useAuthStore();
const toast = useToast();

interface Tag {
  id: number;
  name: string;
  about?: string;
  color: string;
}

interface CommentTemplate {
  id: number;
  name: string;
  content: string;
  is_active: boolean | string;
  created_at?: string | Date;
  updated_at?: string | Date;
  created_by?: number;
}

interface ApiResponse {
  success: boolean;
  record?: CallRecord;
  error?: string;
}

interface CallRecord {
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
  callback_comment?: string;
  [key: string]: unknown;
}

// Состояния
const isLoading = ref(false);
const isUpdatingTag = ref(false);
const currentRecord = ref<CallRecord | null>(null);
const listtag = ref<Tag[]>([]);
const commentText = ref("");
const showCallbackModal = ref(false);
const isSettingCallback = ref(false);
const callbackDateTime = ref("");
const callbackComment = ref("");
const noMoreRecords = ref(false);
const recordEndMessage = ref("");
const isEditingComment = ref(false);

// Состояние для шаблона комментария и Toast UI Editor
const defaultTemplate = ref<CommentTemplate | null>(null);
// Удалены неиспользуемые переменные для Toast UI Editor

// Ссылка на обработчик события для правильной очистки
const loadRecordHandler = ref<((event: Event) => void) | null>(null);

// Computed properties для телефона и ссылок
const phoneRegion = computed(() => {
  return currentRecord.value?.phone
    ? getPhoneRegion(currentRecord.value.phone)
    : null;
});

const formattedPhone = computed(() => {
  return currentRecord.value?.phone
    ? formatPhoneNumber(currentRecord.value.phone)
    : "";
});

const cleanPhone = computed(() => {
  if (!currentRecord.value?.phone) return "";
  return currentRecord.value.phone.replace(/[^\d]/g, "");
});

const microsipLink = computed(() => {
  if (!cleanPhone.value) return "#";
  return `sip:${cleanPhone.value}`;
});

const whatsappLink = computed(() => {
  if (!cleanPhone.value) return "#";
  // WhatsApp ссылка с российским кодом
  const phone = cleanPhone.value.startsWith("8")
    ? "7" + cleanPhone.value.slice(1)
    : cleanPhone.value;
  return `https://wa.me/${phone}`;
});

const viberLink = computed(() => {
  if (!cleanPhone.value) return "#";
  // Viber ссылка
  const phone = cleanPhone.value.startsWith("8")
    ? "7" + cleanPhone.value.slice(1)
    : cleanPhone.value;
  return `viber://chat?number=%2B${phone}`;
});

// Минимальное время для перезвона (текущее время + 5 минут)
const minDateTime = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now.toISOString().slice(0, 16);
});

// Поля для отображения
const displayFields = [
  { key: "fio", label: "ФИО" },
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

// Форматирование времени перезвона
const formatCallbackTime = (callbackTime: string) => {
  try {
    const date = new Date(callbackTime);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return callbackTime;
  }
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

// Загрузка дефолтного шаблона комментария
const getDefaultTemplate = async () => {
  try {
    console.log("=== ПОЛУЧЕНИЕ ШАБЛОНА КОММЕНТАРИЯ ===");

    const response = await $fetch("/api/comment-templates/list");
    console.log("Ответ от API:", response);

    if (
      response &&
      response.status === "success" &&
      response.templates &&
      response.templates.length > 0
    ) {
      // Берем первый активный шаблон как дефолтный
      if (response.templates[0]) {
        // Создаем объект с необходимыми полями
        defaultTemplate.value = {
          id: response.templates[0].id,
          name: response.templates[0].name,
          content: response.templates[0].content,
          is_active: true, // По умолчанию считаем шаблон активным
        };
      } else {
        defaultTemplate.value = null;
      }
      console.log("Загружен шаблон комментария:", defaultTemplate.value);
    } else {
      console.log("Шаблоны комментариев не найдены");
    }
  } catch (error) {
    console.error("Ошибка при загрузке шаблона комментария:", error);
  }
};

// Удалено: инициализация комментариев происходит автоматически через v-model

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

      // Загружаем комментарий в текстовое поле
      if (response.record.description) {
        commentText.value = response.record.description;
        console.log("Загружен существующий комментарий");
      } else {
        // Если комментария нет, вставляем шаблон
        if (defaultTemplate.value?.content) {
          commentText.value = defaultTemplate.value.content;
          console.log("Вставлен шаблон комментария");
        } else {
          commentText.value = "";
          console.log("Комментарий пустой");
        }
      }

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
    const errorObj = error as {
      data?: { code?: string; data?: { errorCode?: string } };
    };
    if (
      errorObj.data &&
      (errorObj.data.code === "USER_NOT_EXISTS" ||
        errorObj.data.data?.errorCode === "USER_NOT_EXISTS")
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
    })) as { status: string; record?: CallRecord; message?: string };

    console.log("Ответ от API:", response);

    if (response.status === "success" && response.record) {
      currentRecord.value = response.record;

      // Загружаем комментарий или вставляем шаблон
      if (
        response.record.description &&
        response.record.description.trim() !== ""
      ) {
        commentText.value = response.record.description;
        console.log("Загружен существующий комментарий из перезвона");
      } else {
        // Если комментария нет, вставляем шаблон
        if (defaultTemplate.value?.content) {
          commentText.value = defaultTemplate.value.content;
          console.log("Вставлен шаблон комментария в перезвон");
        } else {
          commentText.value = "";
          console.log("Комментарий пустой, шаблон не найден");
        }
      }

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

// Выбор и назначение тега сразу без подтверждения + автосохранение комментария
const selectTag = async (tag: Tag) => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!currentRecord.value || !tag.name || !auth.isAuthenticated) return;

  isUpdatingTag.value = true;

  try {
    // Сохраняем комментарий перед назначением тега
    const commentContent = commentText.value;

    // Назначаем тег записи
    const response = await $fetch("/api/records/setTag", {
      method: "POST",
      body: {
        recordId: currentRecord.value.id,
        tagId: tag.id,
        comment: commentContent, // Передаем комментарий вместе с тегом
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

      // Обновляем комментарий
      currentRecord.value.description = commentContent;
      commentText.value = commentContent;

      toast.add({
        title: "Успешно",
        description: "Тег и комментарий сохранены",
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

    const errorData = error as { data?: { code?: string }; message?: string };

    // Проверка на ошибку USER_NOT_EXISTS
    if (errorData.data && errorData.data.code === "USER_NOT_EXISTS") {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: errorData.message || "Не удалось назначить тег",
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
        callbackComment: callbackComment.value || null, // Отдельное поле для комментария перезвона
      },
    });

    if (response && response.status === "success") {
      // Обновляем текущую запись
      currentRecord.value.tag = "ПЕРЕЗВОН";
      currentRecord.value.callback_time = callbackDateTime.value;

      // НЕ перезаписываем основной комментарий - callbackComment сохраняется отдельно

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

    const errorObj = error as {
      data?: { code?: string; data?: { errorCode?: string } };
      message?: string;
    };

    if (
      errorObj.data &&
      (errorObj.data.code === "USER_NOT_EXISTS" ||
        errorObj.data.data?.errorCode === "USER_NOT_EXISTS")
    ) {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
      return;
    }

    toast.add({
      title: "Ошибка",
      description: errorObj.message || "Не удалось назначить перезвон",
      color: "error",
    });
  } finally {
    isSettingCallback.value = false;
  }
};

// Копирование номера телефона
const copyPhone = async () => {
  if (!formattedPhone.value) return;

  try {
    await navigator.clipboard.writeText(formattedPhone.value);
    toast.add({
      title: "Успешно",
      description: "Номер телефона скопирован",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Ошибка",
      description: "Не удалось скопировать номер",
      color: "error",
    });
  }
};

// Инициализация компонента
onMounted(async () => {
  console.log("=== onMounted НАЧАЛО ===");

  // Проверяем аутентификацию
  await auth.checkAuth();

  if (auth.isAuthenticated) {
    console.log("Пользователь аутентифицирован, начинаем инициализацию");

    // Загружаем теги и шаблон
    await getTags();
    await getDefaultTemplate();

    console.log("Загружаем первую запись");
    await fetchRecord();

    // Больше не нужно инициализировать редактор для textarea

    console.log("=== onMounted ЗАВЕРШЕН ===");
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
  // Очищаем обработчик события
  if (loadRecordHandler.value) {
    window.removeEventListener("loadRecord", loadRecordHandler.value);
    loadRecordHandler.value = null;
  }
});
</script>

<style scoped>
/* Стили для простого текстового редактора */
.comment-editor-wrapper {
  width: 100%;
  height: 280px;
  min-height: 280px;
}

.comment-editor-wrapper textarea {
  background-color: rgb(17 24 39) !important;
  color: white !important;
  border: 1px solid rgb(75 85 99) !important;
  border-radius: 0.375rem !important;
  padding: 16px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  resize: none !important;
  outline: none !important;
}

.comment-editor-wrapper textarea:focus {
  border-color: rgb(59 130 246) !important;
  box-shadow: 0 0 0 1px rgb(59 130 246) !important;
}
</style>
