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

    <div v-else class="space-y-2">
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
            <client-only>
              <div class="toast-editor-wrapper">
                <div ref="editorElement" class="toast-editor" />
              </div>
            </client-only>
            <template #help>
              <span class="text-xs text-gray-500">
                Визуальный редактор для создания шаблона комментария
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
import { ref, onMounted, nextTick } from "vue";

const toast = useToast();

interface CommentTemplate {
  id: number;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Состояния
const template = ref<CommentTemplate | null>(null);
const loading = ref(false);
const showModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);

// Toast UI Editor
const editorElement = ref<HTMLElement | null>(null);
interface ToastEditor {
  setHTML: (html: string) => void;
  getHTML: () => string;
  destroy: () => void;
}
let toastEditor: ToastEditor | null = null;

// Форма
const form = ref({
  name: "",
  content: "",
});

// Инициализация TOAST UI Editor
const initEditor = async () => {
  if (!editorElement.value) return;

  try {
    const { default: Editor } = await import("@toast-ui/editor");
    await import("@toast-ui/editor/dist/toastui-editor.css");
    await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");

    toastEditor = new Editor({
      el: editorElement.value,
      height: "300px",
      initialEditType: "wysiwyg",
      previewStyle: "tab",
      placeholder: "Введите текст шаблона комментария...",
      theme: "dark",
      usageStatistics: false,
      hideModeSwitch: true,
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["ul", "ol"],
        ["link"],
        ["hr"],
      ],
    });

    // Устанавливаем начальное содержимое
    if (form.value.content && toastEditor) {
      toastEditor.setHTML(form.value.content);
    }
  } catch (error) {
    console.error("Ошибка инициализации редактора:", error);
  }
};

// Получение содержимого из редактора
const getEditorContent = () => {
  return toastEditor ? toastEditor.getHTML() : "";
};

// Установка содержимого в редактор
const setEditorContent = (content: string) => {
  if (toastEditor) {
    toastEditor.setHTML(content || "");
  }
};

// Уничтожение редактора
const destroyEditor = () => {
  if (toastEditor) {
    toastEditor.destroy();
    toastEditor = null;
  }
};

// Загрузка шаблона
const loadTemplate = async () => {
  try {
    loading.value = true;

    const response = await $fetch("/api/admin/comment-templates/list");

    if (response.status === "success" && response.templates.length > 0) {
      template.value = response.templates[0]; // Единственный шаблон
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

  // Инициализируем редактор после открытия модального окна
  await nextTick();
  setTimeout(initEditor, 100);
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

  // Инициализируем редактор и устанавливаем содержимое
  await nextTick();
  setTimeout(() => {
    initEditor();
    setTimeout(() => setEditorContent(template.value!.content), 200);
  }, 100);
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  form.value = { name: "", content: "" };
  isEditing.value = false;

  // Уничтожаем редактор при закрытии
  destroyEditor();
};

// Сохранение шаблона
const saveTemplate = async () => {
  try {
    saving.value = true;

    // Получаем содержимое из редактора
    const content = getEditorContent();

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
      throw new Error(response.message);
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
