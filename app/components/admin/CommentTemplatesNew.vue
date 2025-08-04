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
          <span v-if="template" class="text-xs text-green-500">(активен)</span>
          <span v-else class="text-xs text-gray-500">(не создан)</span>
        </div>
        <UButton
          v-if="!template"
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          @click="createTemplate"
        >
          Создать шаблон
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
      <UButton color="primary" @click="createTemplate">
        Создать шаблон
      </UButton>
    </div>

    <div v-else class="space-y-4">
      <div
        class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-green-50 dark:bg-green-900/20"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-document-text" class="text-green-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">
              {{ template.name }}
            </h3>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-pencil"
              size="sm"
              color="primary"
              variant="soft"
              @click="editTemplate"
            >
              Редактировать
            </UButton>
            <UButton
              icon="i-heroicons-trash"
              size="sm"
              color="error"
              variant="soft"
              :loading="deleting"
              @click="deleteTemplate"
            >
              Удалить
            </UButton>
          </div>
        </div>

        <div
          class="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border"
        >
          <div v-html="template.content"></div>
        </div>
      </div>
    </div>
  </UCard>

  <!-- Модальное окно создания/редактирования шаблона -->
  <UModal
    v-model:open="showModal"
    :title="isEditing ? 'Редактировать шаблон' : 'Создать шаблон'"
  >
    <template #default>
      <div class="p-4 space-y-4">
        <UFormField label="Название шаблона" required>
          <UInput
            v-model="form.name"
            placeholder="Введите название шаблона..."
            :disabled="saving"
          />
        </UFormField>

        <UFormField label="Содержимое шаблона" required>
          <div id="template-editor-container" class="toast-editor-wrapper">
            <div ref="templateEditorElement" class="toast-editor" />
          </div>
        </UFormField>

        <div class="flex justify-end gap-3">
          <UButton color="neutral" @click="closeModal" :disabled="saving">
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.name || !form.content"
            @click="saveTemplate"
          >
            {{ isEditing ? "Сохранить изменения" : "Создать шаблон" }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

interface CommentTemplate {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  created_by: number;
}

const toast = useToast();

// Состояния
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const template = ref<CommentTemplate | null>(null);
const showModal = ref(false);
const isEditing = ref(false);
const templateEditorElement = ref<HTMLElement | null>(null);
let templateEditor: {
  setHTML: (html: string) => void;
  getHTML: () => string;
  destroy: () => void;
} | null = null;

const form = ref({
  name: "",
  content: "",
});

// Инициализация Toast UI Editor для шаблона
const initTemplateEditor = async () => {
  if (!templateEditorElement.value) return;

  try {
    const { default: Editor } = await import("@toast-ui/editor");
    await import("@toast-ui/editor/dist/toastui-editor.css");
    await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");

    templateEditor = new Editor({
      el: templateEditorElement.value,
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
    }) as {
      setHTML: (html: string) => void;
      getHTML: () => string;
      destroy: () => void;
    };

    // Если редактируем существующий шаблон, загружаем его содержимое
    if (isEditing.value && template.value) {
      templateEditor.setHTML(template.value.content);
    }
  } catch (error) {
    console.error("Ошибка при инициализации редактора:", error);
  }
};

// Загрузка единственного шаблона
const loadTemplate = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/admin/comment-templates/list");
    if (response.status === "success" && response.templates.length > 0) {
      template.value = response.templates[0]; // Берем первый (и единственный) шаблон
    }
  } catch (error) {
    console.error("Error loading template:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить шаблон",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Создание шаблона
const createTemplate = async () => {
  form.value = { name: "", content: "" };
  isEditing.value = false;
  showModal.value = true;

  await nextTick();
  await initTemplateEditor();
};

// Редактирование шаблона
const editTemplate = async () => {
  if (!template.value) return;

  form.value = {
    name: template.value.name,
    content: template.value.content,
  };
  isEditing.value = true;
  showModal.value = true;

  await nextTick();
  await initTemplateEditor();
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  form.value = { name: "", content: "" };
  isEditing.value = false;

  if (templateEditor) {
    templateEditor.destroy();
    templateEditor = null;
  }
};

// Сохранение шаблона
const saveTemplate = async () => {
  if (!templateEditor) return;

  const content = templateEditor.getHTML();
  form.value.content = content;

  if (!form.value.name.trim() || !content.trim()) {
    toast.add({
      title: "Ошибка",
      description: "Заполните все поля",
      color: "error",
    });
    return;
  }

  saving.value = true;
  try {
    let response;

    if (isEditing.value && template.value) {
      // Обновление существующего шаблона
      response = await $fetch("/api/admin/comment-templates/update", {
        method: "POST",
        body: {
          id: template.value.id,
          name: form.value.name.trim(),
          content: content.trim(),
          is_active: true,
        },
      });
    } else {
      // Создание нового шаблона (удаляем старый, если есть)
      if (template.value) {
        await $fetch("/api/admin/comment-templates/delete", {
          method: "POST",
          body: { id: template.value.id },
        });
      }

      response = await $fetch("/api/admin/comment-templates/create", {
        method: "POST",
        body: {
          name: form.value.name.trim(),
          content: content.trim(),
        },
      });
    }

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: isEditing.value ? "Шаблон обновлен" : "Шаблон создан",
        color: "success",
      });
      closeModal();
      await loadTemplate();
    }
  } catch (error) {
    console.error("Error saving template:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось сохранить шаблон",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

// Удаление шаблона
const deleteTemplate = async () => {
  if (!template.value) return;

  deleting.value = true;
  try {
    const response = await $fetch("/api/admin/comment-templates/delete", {
      method: "POST",
      body: { id: template.value.id },
    });

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: "Шаблон удален",
        color: "success",
      });
      template.value = null;
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить шаблон",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
};

// Инициализация при монтировании
onMounted(async () => {
  await loadTemplate();
});
</script>

<style scoped>
.toast-editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-top: 0.5rem;
}

.toast-editor {
  min-height: 300px;
}

/* Темная тема для редактора */
:deep(.toastui-editor-dark) {
  background-color: #1f2937;
  color: #f9fafb;
}

:deep(.toastui-editor-dark .toastui-editor-toolbar) {
  background-color: #374151;
  border-bottom: 1px solid #4b5563;
}

:deep(.toastui-editor-dark .toastui-editor-main) {
  background-color: #1f2937;
}

:deep(.toastui-editor-dark .toastui-editor-md-container .toastui-editor-md) {
  background-color: #1f2937;
  color: #f9fafb;
}

:deep(.toastui-editor-dark .toastui-editor-ww-container .toastui-editor-ww) {
  background-color: #1f2937;
  color: #f9fafb;
}
</style>
