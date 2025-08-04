<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-chat-bubble-left-right"
            class="text-purple-500"
          />
          <span class="font-semibold">Шаблон комментария</span>
        </div>
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          @click="openCreateModal"
        >
          {{ template ? "Редактировать" : "Создать" }}
        </UButton>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>

    <div v-else-if="!template" class="text-center py-8">
      <UIcon
        name="i-heroicons-chat-bubble-left-right"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-500 mb-4">Шаблон комментария не создан</p>
      <UButton color="primary" @click="openCreateModal">
        Создать шаблон
      </UButton>
    </div>

    <div v-else class="space-y-4">
      <!-- Заголовок шаблона с действием редактирования -->
      <div
        class="group p-3 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-pointer hover:shadow-sm"
        @click="openEditModal"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-document-text"
              class="text-green-600 dark:text-green-400 w-4 h-4 flex-shrink-0"
            />
            <h4
              class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors truncate"
            >
              {{ template.name }}
            </h4>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-green-600 dark:text-green-400 font-medium"
              >Активен</span
            >
            <UIcon
              name="i-heroicons-chevron-right"
              class="text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0"
            />
          </div>
        </div>
      </div>

      <!-- Предпросмотр содержимого шаблона -->
      <div
        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <h5 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Содержимое шаблона:
        </h5>
        <div
          class="whitespace-pre-wrap text-gray-700 dark:text-gray-200 overflow-auto max-h-[300px] p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
        >
          {{ template.content }}
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования -->
    <UModal
      v-model:open="showModal"
      :title="isEditing ? 'Редактировать шаблон' : 'Создать шаблон'"
    >
      <template #body>
        <div class="p-4">
          <UFormField label="Название шаблона" class="mb-4">
            <UInput
              v-model="form.name"
              placeholder="Введите название шаблона"
              icon="i-heroicons-document-text"
            />
          </UFormField>

          <UFormField label="Содержимое шаблона">
            <div class="w-full" style="height: 400px">
              <UTextarea
                v-model="form.content"
                placeholder="Введите текст шаблона комментария..."
                class="w-full h-full min-h-[350px]"
                style="height: 100% !important; resize: none"
                :rows="20"
                :ui="{
                  base: 'w-full h-full',
                }"
              />
            </div>
            <template #help>
              <span class="text-xs text-gray-500">
                Введите текст шаблона комментария
              </span>
            </template>
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 mt-6 p-4 border-t">
          <UButton color="neutral" @click="closeModal">Отмена</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.name"
            @click="saveTemplate"
          >
            {{ isEditing ? "Обновить" : "Создать" }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const toast = useToast();

interface CommentTemplate {
  id: number;
  name: string;
  content: string;
  is_active: boolean | string;
  created_at: string | Date;
  updated_at?: string | Date;
  created_by?: number;
}

// Состояния
const template = ref<CommentTemplate | null>(null);
const loading = ref(false);
const showModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);

// Форма
const form = ref({
  name: "",
  content: "",
});

// Загрузка шаблона
const loadTemplate = async () => {
  try {
    loading.value = true;

    const response = await $fetch("/api/admin/comment-templates/list");

    if (response.status === "success" && response.templates.length > 0) {
      template.value = response.templates[0] || null; // Единственный шаблон
    }
  } catch (error) {
    console.error("Ошибка загрузки шаблона:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить шаблон",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна для создания
const openCreateModal = async () => {
  if (template.value) {
    // Если шаблон уже есть, открываем для редактирования
    openEditModal();
    return;
  }

  isEditing.value = false;
  form.value = { name: "", content: "" };
  showModal.value = true;
};

// Открытие модального окна для редактирования
const openEditModal = async () => {
  if (!template.value) return;

  isEditing.value = true;
  form.value = {
    name: template.value.name,
    content: template.value.content,
  };
  showModal.value = true;
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  form.value = { name: "", content: "" };
  isEditing.value = false;
};

// Сохранение шаблона
const saveTemplate = async () => {
  try {
    saving.value = true;

    // Получаем содержимое из формы
    const content = form.value.content;

    const endpoint = isEditing.value
      ? "/api/admin/comment-templates/update"
      : "/api/admin/comment-templates/create";

    const payload = isEditing.value
      ? { id: template.value?.id, name: form.value.name, content }
      : { name: form.value.name, content };

    const response = await $fetch(endpoint, {
      method: "POST",
      body: payload,
    });

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: isEditing.value ? "Шаблон обновлен" : "Шаблон создан",
        color: "success",
      });

      closeModal();
      await loadTemplate();
    } else {
      throw new Error("Не удалось сохранить шаблон");
    }
  } catch (error: unknown) {
    console.error("Ошибка сохранения шаблона:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Не удалось сохранить шаблон";
    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

// Инициализация
onMounted(async () => {
  await loadTemplate();
});
</script>

<style scoped>
/* TOAST UI Editor стили */
.toast-editor-wrapper {
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
}

.dark .toast-editor-wrapper {
  border-color: rgb(75 85 99);
  background-color: rgb(17 24 39);
}

/* Минимальные переопределения для интеграции с темой */
.dark .toast-editor-wrapper :deep(.toastui-editor-defaultUI) {
  background-color: rgb(17 24 39) !important;
  border: none !important;
}

.toast-editor {
  min-height: 300px;
}

/* Улучшенные переходы для карточки шаблона */
.group {
  position: relative;
}

.group::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.05) 0%,
    rgba(74, 222, 128, 0.05) 100%
  );
  border-radius: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.group:hover::before {
  opacity: 1;
}

.dark .group::before {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.08) 0%,
    rgba(74, 222, 128, 0.08) 100%
  );
}
</style>
