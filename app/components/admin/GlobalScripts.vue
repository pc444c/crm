<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-globe-alt" class="text-blue-500" />
          <span class="font-semibold">Глобальные скрипты</span>
          <span class="text-xs text-gray-500">({{ scripts.length }})</span>
        </div>
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          @click="openCreateModal"
        >
          Создать
        </UButton>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>

    <div v-else-if="scripts.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-globe-alt" class="text-4xl text-gray-400 mb-2" />
      <p class="text-gray-500 mb-4">Глобальных скриптов пока нет</p>
      <UButton color="primary" @click="openCreateModal">
        Создать первый скрипт
      </UButton>
    </div>

    <div v-else class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="script in scripts"
        :key="script.id"
        class="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
        :class="{
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700':
            script.is_active === 'true',
          'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-75':
            script.is_active === 'false',
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Переключатель активности -->
            <USwitch
              :model-value="script.is_active === 'true'"
              :disabled="updatingScripts.has(script.id)"
              size="sm"
              @update:model-value="toggleScriptStatus(script, $event)"
            />

            <!-- Название скрипта -->
            <div
              class="flex-1 min-w-0 cursor-pointer"
              @click="viewScript(script)"
            >
              <h4
                class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
                :class="{
                  'text-green-700 dark:text-green-400':
                    script.is_active === 'true',
                  'text-gray-500 dark:text-gray-400':
                    script.is_active === 'false',
                }"
              >
                {{ script.name }}
                <span
                  v-if="script.is_active === 'false'"
                  class="text-xs text-gray-400 ml-1"
                >
                  (неактивен)
                </span>
              </h4>
              <p class="text-xs text-gray-500 truncate mt-1">
                Создан: {{ formatDate(script.created_at) }}
                <span
                  v-if="
                    script.updated_at && script.updated_at !== script.created_at
                  "
                >
                  · Изменен: {{ formatDate(script.updated_at) }}
                </span>
              </p>
            </div>
          </div>

          <!-- Действия -->
          <div class="flex items-center gap-1">
            <UButton
              icon="i-heroicons-eye"
              size="xs"
              color="primary"
              variant="ghost"
              :title="'Просмотр'"
              @click.stop="viewScript(script)"
            />
            <UButton
              icon="i-heroicons-pencil"
              size="xs"
              color="warning"
              variant="ghost"
              :title="'Редактировать'"
              :disabled="updatingScripts.has(script.id)"
              @click.stop="editScriptFn(script)"
            />
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              color="error"
              variant="ghost"
              :title="'Удалить'"
              :disabled="deletingScripts.has(script.id)"
              @click.stop="confirmDeleteScript(script)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-heroicons-plus" class="text-blue-500" />
            <h3 class="text-lg font-semibold">Создать глобальный скрипт</h3>
          </div>

          <div class="space-y-4">
            <UFormField label="Название скрипта" required>
              <UInput
                v-model="newScript.name"
                placeholder="Введите название..."
                :maxlength="255"
              />
            </UFormField>

            <UFormField label="Содержимое скрипта" required>
              <client-only>
                <div class="toast-editor-wrapper">
                  <div ref="editorElement" class="toast-editor" />
                </div>
              </client-only>
              <template #help>
                <span class="text-xs text-gray-500">
                  Визуальный редактор текста с возможностью форматирования
                </span>
              </template>
            </UFormField>

            <div class="text-xs text-gray-500">
              Этот скрипт будет доступен всем пользователям в режиме "только
              чтение"
            </div>
          </div>

          <div
            class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton color="neutral" @click="closeCreateModal">Отмена</UButton>
            <UButton
              color="primary"
              :loading="creating"
              :disabled="!newScript.name.trim()"
              @click="createScript"
            >
              Создать
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Модальное окно просмотра -->
    <UModal v-model:open="showViewModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-heroicons-eye" class="text-blue-500" />
            <h3 class="text-lg font-semibold">
              Просмотр скрипта: {{ viewingScript?.name }}
            </h3>
          </div>

          <div v-if="viewingScript" class="space-y-4">
            <p class="text-sm text-gray-500">
              Создан: {{ formatDate(viewingScript.created_at) }}
              <span
                v-if="
                  viewingScript.updated_at &&
                  viewingScript.updated_at !== viewingScript.created_at
                "
              >
                · Изменен: {{ formatDate(viewingScript.updated_at) }}
              </span>
            </p>

            <div>
              <label class="block text-sm font-medium mb-2"
                >Предварительный просмотр:</label
              >
              <div
                ref="viewerElement"
                class="p-3 border rounded min-h-24 bg-white dark:bg-gray-900 script-viewer border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          <div
            class="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton color="neutral" @click="closeViewModal">Закрыть</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Модальное окно редактирования -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-heroicons-pencil" class="text-orange-500" />
            <h3 class="text-lg font-semibold">Редактирование скрипта</h3>
          </div>

          <div class="space-y-4">
            <UFormField label="Название скрипта" required>
              <UInput
                v-model="editScript.name"
                placeholder="Введите название скрипта"
                :disabled="editing"
              />
            </UFormField>

            <UFormField label="Содержимое скрипта" required>
              <client-only>
                <div class="toast-editor-wrapper">
                  <div ref="editEditorElement" class="toast-editor" />
                </div>
              </client-only>
              <template #help>
                <span class="text-xs text-gray-500">
                  Визуальный редактор текста с возможностью форматирования
                </span>
              </template>
            </UFormField>

            <UFormField label="Статус скрипта">
              <div class="flex items-center gap-3">
                <USwitch v-model="editScript.is_active" color="primary" />
                <span
                  :class="
                    editScript.is_active
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ editScript.is_active ? "Активен" : "Неактивен" }}
                </span>
              </div>
              <template #help>
                <span class="text-xs text-gray-500">
                  Активные скрипты отображаются пользователям, неактивные -
                  скрыты
                </span>
              </template>
            </UFormField>
          </div>

          <div
            class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              color="neutral"
              :disabled="editing"
              @click="closeEditModal"
            >
              Отмена
            </UButton>
            <UButton
              color="primary"
              :loading="editing"
              :disabled="!editScript.name.trim()"
              @click="saveEditScript"
            >
              Сохранить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Модальное окно подтверждения удаления -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-heroicons-trash" class="text-red-500" />
            <h3 class="text-lg font-semibold">Удаление скрипта</h3>
          </div>

          <div class="space-y-4">
            <p class="text-gray-700 dark:text-gray-300">
              Вы уверены, что хотите удалить скрипт
              <strong class="text-gray-900 dark:text-gray-100">
                "{{ deletingScript?.name }}" </strong
              >?
            </p>
            <p class="text-sm text-red-600 dark:text-red-400">
              Это действие необратимо. Скрипт будет удален навсегда.
            </p>
          </div>

          <div
            class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton color="neutral" @click="closeDeleteModal">
              Отмена
            </UButton>
            <UButton
              color="error"
              :loading="deletingScripts.has(deletingScript?.id || 0)"
              @click="deleteScript"
            >
              Удалить
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

interface GlobalScript {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_active: string;
  created_by: number;
}

const toast = useToast();

// Состояния
const loading = ref(false);
const creating = ref(false);
const editing = ref(false);
const scripts = ref<GlobalScript[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingScript = ref<GlobalScript | null>(null);
const editingScript = ref<GlobalScript | null>(null);
const deletingScript = ref<GlobalScript | null>(null);

// Множества для отслеживания состояний
const updatingScripts = ref(new Set<number>());
const deletingScripts = ref(new Set<number>());

const newScript = ref({
  name: "",
  content: "",
});

const editScript = ref({
  name: "",
  content: "",
  is_active: false,
});

// TOAST UI Editor
const editorElement = ref<HTMLElement | null>(null);
const editEditorElement = ref<HTMLElement | null>(null);
const viewerElement = ref<HTMLElement | null>(null);
interface ToastEditor {
  setHTML: (html: string) => void;
  getHTML: () => string;
  destroy: () => void;
}
interface ToastViewer {
  destroy: () => void;
}
let toastEditor: ToastEditor | null = null;
let toastEditEditor: ToastEditor | null = null;
let toastViewer: ToastViewer | null = null;

// Инициализация TOAST UI Editor
const initEditor = async () => {
  if (!editorElement.value) return;

  try {
    const { default: Editor } = await import("@toast-ui/editor");
    await import("@toast-ui/editor/dist/toastui-editor.css");
    await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");

    toastEditor = new Editor({
      el: editorElement.value,
      height: "400px",
      initialEditType: "wysiwyg",
      previewStyle: "tab",
      placeholder: "Введите текст глобального скрипта...",
      theme: "dark",
      usageStatistics: false,
      hideModeSwitch: true,
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["ul", "ol"],
        ["indent", "outdent"],
        ["table", "link"],
        ["hr"],
      ],
    });

    // Устанавливаем начальное содержимое
    if (newScript.value.content && toastEditor) {
      toastEditor.setHTML(newScript.value.content);
    }
  } catch (error) {
    console.error("Ошибка инициализации редактора:", error);
  }
};

// Получение содержимого из редактора
const getEditorContent = () => {
  return toastEditor ? toastEditor.getHTML() : "";
};

// Уничтожение редактора
const destroyEditor = () => {
  if (toastEditor) {
    toastEditor.destroy();
    toastEditor = null;
  }
};

// Инициализация отображения контента
const initViewer = async (content: string) => {
  if (!viewerElement.value) return;

  try {
    // Пробуем использовать TOAST UI Viewer
    const { default: Viewer } = await import(
      "@toast-ui/editor/dist/toastui-editor-viewer"
    );
    await import("@toast-ui/editor/dist/toastui-editor-viewer.css");
    await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");

    // Очищаем предыдущий viewer
    if (toastViewer) {
      toastViewer.destroy();
    }

    toastViewer = new Viewer({
      el: viewerElement.value,
      initialValue: content,
      theme: "dark",
    });
  } catch {
    console.log("Используем простое HTML отображение");
    // Если viewer не работает, используем прямое HTML отображение
    renderHtmlContent(content);
  }
};

// Функция для безопасного рендеринга HTML контента
const renderHtmlContent = (content: string) => {
  if (!viewerElement.value) return;

  // Безопасная очистка HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;

  // Удаляем потенциально опасные элементы и атрибуты
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  const elements = tempDiv.querySelectorAll("*");
  elements.forEach((element) => {
    // Удаляем опасные атрибуты
    const dangerousAttrs = [
      "onclick",
      "onload",
      "onerror",
      "onmouseover",
      "onfocus",
      "onblur",
    ];
    dangerousAttrs.forEach((attr) => {
      element.removeAttribute(attr);
    });
  });

  // Очищаем и устанавливаем HTML контент
  viewerElement.value.innerHTML = tempDiv.innerHTML;
  viewerElement.value.className =
    "script-viewer prose dark:prose-invert max-w-none";
};

// Уничтожение viewer
const destroyViewer = () => {
  if (toastViewer) {
    toastViewer.destroy();
    toastViewer = null;
  }
};

// Форматирование даты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Загрузка скриптов
const loadScripts = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/admin/scripts/list");
    if (response.status === "success") {
      scripts.value = response.scripts;
    }
  } catch (error) {
    console.error("Error loading scripts:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить скрипты",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна создания
const openCreateModal = async () => {
  newScript.value = { name: "", content: "" };
  showCreateModal.value = true;

  // Инициализируем редактор после открытия модального окна
  await nextTick();
  setTimeout(initEditor, 100);
};

// Закрытие модального окна создания
const closeCreateModal = () => {
  showCreateModal.value = false;
  newScript.value = { name: "", content: "" };

  // Уничтожаем редактор при закрытии
  destroyEditor();
};

// Создание скрипта
const createScript = async () => {
  creating.value = true;
  try {
    // Получаем содержимое из редактора
    const content = getEditorContent();

    const response = await $fetch("/api/admin/scripts/create", {
      method: "POST",
      body: {
        name: newScript.value.name.trim(),
        content: content,
      },
      credentials: "include", // Убедимся, что cookies отправляются
    });

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: "Глобальный скрипт создан",
        color: "success",
      });
      closeCreateModal();
      await loadScripts();
    }
  } catch (error) {
    console.error("Error creating script:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось создать скрипт",
      color: "error",
    });
  } finally {
    creating.value = false;
  }
};

// Переключение статуса скрипта (активен/неактивен)
const toggleScriptStatus = async (script: GlobalScript, isActive: boolean) => {
  updatingScripts.value.add(script.id);
  try {
    const response = await $fetch("/api/admin/scripts/update", {
      method: "POST",
      body: {
        id: script.id,
        is_active: isActive,
      },
      credentials: "include",
    });

    if (response.status === "success") {
      // Обновляем локальные данные
      script.is_active = isActive ? "true" : "false";
      script.updated_at = response.script.updated_at;

      toast.add({
        title: "Успешно",
        description: `Скрипт ${isActive ? "активирован" : "деактивирован"}`,
        color: "success",
      });
    }
  } catch (error) {
    console.error("Error updating script status:", error);
    // Возвращаем исходное состояние
    script.is_active = script.is_active === "true" ? "false" : "true";
    toast.add({
      title: "Ошибка",
      description: "Не удалось изменить статус скрипта",
      color: "error",
    });
  } finally {
    updatingScripts.value.delete(script.id);
  }
};

// Редактирование скрипта
const editScriptFn = (script: GlobalScript) => {
  editingScript.value = script;
  editScript.value = {
    name: script.name,
    content: script.content,
    is_active: script.is_active === "true",
  };
  showEditModal.value = true;

  // Инициализируем редактор для редактирования
  nextTick(() => {
    setTimeout(() => initEditorForEdit(script.content), 100);
  });
};

// Подтверждение удаления скрипта
const confirmDeleteScript = (script: GlobalScript) => {
  deletingScript.value = script;
  showDeleteModal.value = true;
};

// Удаление скрипта
const deleteScript = async () => {
  if (!deletingScript.value) return;

  const scriptId = deletingScript.value.id;
  deletingScripts.value.add(scriptId);

  try {
    const response = await $fetch(`/api/admin/scripts/delete?id=${scriptId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status === "success") {
      // Удаляем из локального списка
      scripts.value = scripts.value.filter((s) => s.id !== scriptId);

      toast.add({
        title: "Успешно",
        description: "Скрипт удален",
        color: "success",
      });
      closeDeleteModal();
    }
  } catch (error) {
    console.error("Error deleting script:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить скрипт",
      color: "error",
    });
  } finally {
    deletingScripts.value.delete(scriptId);
  }
};

// Закрытие модального окна удаления
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deletingScript.value = null;
};

// Функция для инициализации редактора в режиме редактирования
const initEditorForEdit = async (content: string) => {
  if (!editEditorElement.value) return;

  try {
    const { default: Editor } = await import("@toast-ui/editor");
    toastEditEditor = new Editor({
      el: editEditorElement.value,
      height: "300px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      initialValue: content,
      theme: "dark",
    });
  } catch (error) {
    console.error("Failed to initialize TOAST UI Editor:", error);
  }
};

// Получение содержимого редактора редактирования
const getEditEditorContent = (): string => {
  if (!toastEditEditor) return "";
  return toastEditEditor.getHTML();
};

// Уничтожение редактора редактирования
const destroyEditEditor = () => {
  if (toastEditEditor) {
    toastEditEditor.destroy();
    toastEditEditor = null;
  }
};

// Сохранение изменений скрипта
const saveEditScript = async () => {
  if (!editingScript.value) return;

  editing.value = true;
  try {
    const content = getEditEditorContent();

    const response = await $fetch("/api/admin/scripts/update", {
      method: "POST",
      body: {
        id: editingScript.value.id,
        name: editScript.value.name.trim(),
        content: content,
        is_active: editScript.value.is_active,
      },
      credentials: "include",
    });

    if (response.status === "success") {
      // Обновляем локальные данные
      const scriptIndex = scripts.value.findIndex(
        (s) => s.id === editingScript.value!.id
      );
      if (scriptIndex !== -1) {
        scripts.value[scriptIndex] = {
          ...scripts.value[scriptIndex],
          ...response.script,
        };
      }

      toast.add({
        title: "Успешно",
        description: "Скрипт обновлен",
        color: "success",
      });
      closeEditModal();
    }
  } catch (error) {
    console.error("Error updating script:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось обновить скрипт",
      color: "error",
    });
  } finally {
    editing.value = false;
  }
};

// Закрытие модального окна редактирования
const closeEditModal = () => {
  showEditModal.value = false;
  editingScript.value = null;
  editScript.value = { name: "", content: "", is_active: false };
  destroyEditEditor();
};

// Просмотр скрипта
const viewScript = async (script: GlobalScript) => {
  viewingScript.value = script;
  showViewModal.value = true;

  // Инициализируем viewer после открытия модального окна
  await nextTick();
  setTimeout(() => initViewer(script.content), 100);
};

// Закрытие модального окна просмотра
const closeViewModal = () => {
  showViewModal.value = false;
  viewingScript.value = null;

  // Уничтожаем viewer при закрытии
  destroyViewer();
};

// Инициализация
onMounted(() => {
  loadScripts();
});
</script>

<style lang="css" scoped>
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

/* Стили для оптимизированного просмотра скрипта */
.script-viewer {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  line-height: 1.6;
  color: rgb(55 65 81);
  font-size: 16px;
}

.dark .script-viewer {
  color: rgb(209 213 219);
}

/* Убираем лишние отступы в просмотре */
.script-viewer > *:first-child {
  margin-top: 0 !important;
}

.script-viewer > *:last-child {
  margin-bottom: 0 !important;
}

/* Заголовки в просмотре */
.script-viewer h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  line-height: 1.2;
}

.dark .script-viewer h1 {
  color: rgb(243 244 246);
}

.script-viewer h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(31 41 55);
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
  line-height: 1.3;
}

.dark .script-viewer h2 {
  color: rgb(229 231 235);
}

.script-viewer h3 {
  font-size: 1.125rem;
  font-weight: 500;
  color: rgb(55 65 81);
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  line-height: 1.4;
}

.dark .script-viewer h3 {
  color: rgb(209 213 219);
}

/* Параграфы в просмотре */
.script-viewer p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.script-viewer p:empty {
  display: none;
}

/* Жирный и курсивный текст в просмотре */
.script-viewer strong,
.script-viewer b {
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .script-viewer strong,
.dark .script-viewer b {
  color: rgb(243 244 246);
}

.script-viewer em,
.script-viewer i {
  font-style: italic;
  color: rgb(75 85 99);
}

.dark .script-viewer em,
.dark .script-viewer i {
  color: rgb(156 163 175);
}

/* Списки в просмотре */
.script-viewer ul,
.script-viewer ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.script-viewer ul {
  list-style-type: disc;
}

.script-viewer ol {
  list-style-type: decimal;
}

.script-viewer li {
  margin-bottom: 0.25rem;
  line-height: 1.6;
}

/* Цитаты в просмотре */
.script-viewer blockquote {
  border-left: 4px solid rgb(59 130 246);
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: rgb(75 85 99);
  background-color: rgb(248 250 252);
  padding: 0.75rem 1rem;
  border-radius: 0 0.375rem 0.375rem 0;
}

.dark .script-viewer blockquote {
  border-left-color: rgb(96 165 250);
  color: rgb(156 163 175);
  background-color: rgb(30 41 59);
}

/* Код в просмотре */
.script-viewer code {
  background-color: rgb(243 244 246);
  color: rgb(239 68 68);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", "Monaco",
    "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}

.dark .script-viewer code {
  background-color: rgb(55 65 81);
  color: rgb(252 165 165);
}

.script-viewer pre {
  background-color: rgb(248 250 252);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", "Monaco",
    "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.dark .script-viewer pre {
  background-color: rgb(30 41 59);
  border-color: rgb(75 85 99);
  color: rgb(203 213 225);
}

.script-viewer pre code {
  background: none;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

/* Ссылки в просмотре */
.script-viewer a {
  color: rgb(37 99 235);
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.3);
  text-underline-offset: 2px;
  transition: all 0.2s ease;
}

.dark .script-viewer a {
  color: rgb(96 165 250);
  text-decoration-color: rgba(96, 165, 250, 0.3);
}

.script-viewer a:hover {
  color: rgb(29 78 216);
  text-decoration-color: rgb(29 78 216);
}

.dark .script-viewer a:hover {
  color: rgb(147 197 253);
  text-decoration-color: rgb(147 197 253);
}

/* Prose стили для просмотра */
.prose {
  max-width: none;
  color: rgb(55 65 81);
}

.dark .prose {
  color: rgb(209 213 219);
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: rgb(17 24 39);
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.dark .prose h1,
.dark .prose h2,
.dark .prose h3,
.dark .prose h4,
.dark .prose h5,
.dark .prose h6 {
  color: rgb(243 244 246);
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.prose strong {
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .prose strong {
  color: rgb(243 244 246);
}

.prose em {
  font-style: italic;
}

.prose ul,
.prose ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.25rem;
}

.prose blockquote {
  border-left: 4px solid rgb(209 213 219);
  padding-left: 1rem;
  font-style: italic;
  color: rgb(75 85 99);
  margin: 1rem 0;
}

.dark .prose blockquote {
  border-left-color: rgb(75 85 99);
  color: rgb(156 163 175);
}

.prose code {
  background-color: rgb(243 244 246);
  color: rgb(239 68 68);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.dark .prose code {
  background-color: rgb(55 65 81);
  color: rgb(252 165 165);
}
</style>
