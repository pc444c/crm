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
                @click="openModal(index)"
              >
                {{ tag.name }}
              </button>
            </UTooltip>
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
            <UButton size="sm" color="gray" @click="cancelEditComment"
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

  <!-- Модальное окно выбора статуса -->
  <UModal v-model:open="isOpen" title="Подтверждение статуса">
    <template #body>
      <div class="p-4">
        <div class="flex flex-col items-center justify-center gap-4 mb-6">
          <span class="text-lg"
            >Вы уверены, что хотите выбрать этот статус?</span
          >
          <div
            :style="{ backgroundColor: ModalData.color }"
            class="p-2 px-4 text-white rounded font-medium"
          >
            {{ ModalData.name }}
          </div>

          <p class="text-gray-500 text-sm text-center">
            После подтверждения статуса текущая запись будет завершена. Чтобы
            продолжить работу с новыми записями, нажмите кнопку "Продолжить
            работать".
          </p>
        </div>

        <div class="flex justify-center gap-4">
          <UButton color="gray" @click="isOpen = false">Отмена</UButton>
          <UButton
            color="primary"
            icon="i-heroicons-check"
            :loading="isUpdatingTag"
            @click="confirmTagChange"
          >
            Подтвердить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/store/useAuth";

const auth = useAuthStore();
const toast = useToast();

// Состояния
const isLoading = ref(false);
const isOpen = ref(false);
const isUpdatingTag = ref(false);
const currentRecord = ref(null);
const listtag = ref([]);
const ModalData = ref({});
const editingComment = ref(false);
const commentText = ref("");
const isSavingComment = ref(false);

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
const getFieldValue = (key) => {
  return currentRecord.value ? currentRecord.value[key] : "";
};

// Загрузка списка тегов
const getTags = async () => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!auth.isAuthenticated) return;

  try {
    // Сначала пробуем загрузить через API для пользователей
    let response = await $fetch("/api/tags/list").catch((error) => {
      // Если ошибка связана с отсутствием пользователя в базе
      if (error.data && error.data.code === "USER_NOT_EXISTS") {
        auth.setErrorCode("USER_NOT_EXISTS");
        navigateTo("/?error=USER_NOT_EXISTS");
        return null;
      }
      return null;
    });

    // Если не получилось, пробуем через админское API (для обратной совместимости)
    if (!response) {
      response = await $fetch("/api/admin/listtags").catch(() => null);
    }

    if (response && !response.code) {
      console.log("Загружены теги:", response);
      listtag.value = response;
    } else if (response && response.code === "USER_NOT_EXISTS") {
      auth.setErrorCode("USER_NOT_EXISTS");
      navigateTo("/?error=USER_NOT_EXISTS");
    } else {
      throw new Error("Не удалось загрузить теги");
    }
  } catch (error) {
    console.error("Ошибка при загрузке тегов:", error);

    // Проверка на ошибку USER_NOT_EXISTS
    if (error.data && error.data.code === "USER_NOT_EXISTS") {
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
    const response = await $fetch("/api/user/getContant", {
      method: "POST",
      body: {
        userId: auth.getId,
      },
    });

    if (response && response.success && response.record) {
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
          response && response.error ? response.error : "БАЗА ЗАКОНЧИЛАСЬ",
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

// Метод для открытия модального окна выбора тега
const openModal = (index) => {
  isOpen.value = true;
  ModalData.value = listtag.value[index] || {};
};

// Подтвердить изменение тега
const confirmTagChange = async () => {
  // Проверяем актуальность аутентификации перед каждым запросом
  await auth.checkAuth();

  if (!currentRecord.value || !ModalData.value.name || !auth.isAuthenticated)
    return;

  isUpdatingTag.value = true;

  try {
    // Находим tagId по имени тега
    let tagId = null;
    const tagMatch = listtag.value.find((t) => t.name === ModalData.value.name);
    if (tagMatch) {
      tagId = tagMatch.id;
    }

    if (!tagId) {
      throw new Error("Не удалось найти ID тега");
    }

    // Назначаем тег записи
    const response = await $fetch("/api/records/setTag", {
      method: "POST",
      body: {
        recordId: currentRecord.value.id,
        tagId: tagId,
      },
    });

    if (response && response.status === "success") {
      // Обновляем текущую запись с новым тегом
      currentRecord.value.tag = ModalData.value.name;
      currentRecord.value.tagInfo = {
        id: tagId,
        name: ModalData.value.name,
        color: ModalData.value.color,
      };

      toast.add({
        title: "Успешно",
        description: "Тег успешно назначен",
        color: "success",
      });

      // Закрываем модальное окно
      isOpen.value = false;

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
});
</script>
