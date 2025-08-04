<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="text-blue-500" />
          <span class="font-semibold">Мои скрипты</span>
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

    <div
      v-else-if="userScripts.length === 0 && globalScripts.length === 0"
      class="text-center py-8"
    >
      <UIcon
        name="i-heroicons-document-text"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-500 mb-4">У вас пока нет скриптов</p>
      <UButton color="primary" @click="openCreateModal">
        Создать первый скрипт
      </UButton>
    </div>

    <div v-else class="flex-1 flex flex-col min-h-0">
      <!-- Контейнер с overflow для скролла -->
      <div class="flex-1 overflow-y-auto space-y-2">
        <!-- Разделитель для глобальных скриптов -->
        <div
          v-if="globalScripts.length > 0"
          class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-2 mb-2"
        >
          <div
            class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide"
          >
            <UIcon name="i-heroicons-globe-alt" class="w-3 h-3 inline mr-1" />
            Общие скрипты ({{ globalScripts.length }})
          </div>
        </div>

        <!-- Глобальные скрипты -->
        <div v-if="globalScripts.length > 0" class="space-y-2 mb-4">
          <div
            v-for="script in globalScripts"
            :key="`global-${script.id}`"
            class="group p-3 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer hover:shadow-sm"
            @click="viewScript(script)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-globe-alt"
                  class="text-blue-600 dark:text-blue-400 w-4 h-4 flex-shrink-0"
                />
                <h4
                  class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors truncate"
                >
                  {{ script.name }}
                </h4>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs text-blue-600 dark:text-blue-400 font-medium"
                >
                  Только чтение
                </span>
                <UIcon
                  name="i-heroicons-chevron-right"
                  class="text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Разделитель для пользовательских скриптов -->
        <div
          v-if="userScripts.length > 0"
          class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-2 mb-2"
        >
          <div
            class="text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            <UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />
            Мои скрипты ({{ userScripts.length }})
          </div>
        </div>

        <!-- Пользовательские скрипты -->
        <div v-if="userScripts.length > 0" class="space-y-2">
          <div
            v-for="script in userScripts"
            :key="`user-${script.id}`"
            class="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer hover:shadow-sm"
            @click="viewScript(script)"
          >
            <div class="flex items-center justify-between">
              <h4
                class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
              >
                {{ script.name }}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования -->
    <UModal
      v-model:open="showModal"
      :title="isEditing ? 'Редактировать скрипт' : 'Создать скрипт'"
    >
      <template #body>
        <div class="p-4">
          <UFormField label="Название скрипта" class="mb-4">
            <UInput
              v-model="form.name"
              placeholder="Введите название скрипта"
              icon="i-heroicons-document-text"
            />
          </UFormField>

          <UFormField label="Содержимое скрипта">
            <client-only>
              <div id="editor-container" class="toast-editor-wrapper">
                <div ref="editorElement" class="toast-editor" />
              </div>
            </client-only>
            <template #help>
              <span class="text-xs text-gray-500">
                Визуальный редактор текста с возможностью форматирования
              </span>
            </template>
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 mt-6 p-4 border-t">
          <UButton color="neutral" @click="closeModal"> Отмена </UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.name"
            @click="saveScript"
          >
            {{ isEditing ? "Обновить" : "Создать" }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Выезжающий боковой блок для просмотра скрипта -->
    <USlideover
      v-model:open="showViewModal"
      side="right"
      :title="viewingScript?.name || ''"
      :close="{ color: 'neutral', variant: 'ghost' }"
      :ui="{ content: 'right-0 inset-y-0 w-[45%] max-w-none' }"
    >
      <!-- Триггер (пустой, так как открывается программно) -->
      <div />

      <!-- Информация о скрипте в хедере -->
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-text" class="text-blue-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ viewingScript?.name || "" }}
            </h3>
          </div>
        </div>

        <!-- Информация о скрипте -->
        <div
          v-if="viewingScript"
          class="mt-4 p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Создан:</span>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatFullDate(viewingScript.created_at) }}
              </div>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Обновлен:</span>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatFullDate(viewingScript.updated_at) }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Содержимое скрипта -->
      <template #body>
        <div v-if="viewingScript" ref="viewerElement" class="script-viewer" />
      </template>

      <!-- Нижняя панель с кнопками -->
      <template #footer>
        <div v-if="viewingScript" class="flex justify-between w-full">
          <!-- Кнопка удаления только для пользовательских скриптов -->
          <UButton
            v-if="!viewingScript.isGlobal"
            color="error"
            variant="soft"
            icon="i-heroicons-trash"
            @click="deleteScript(viewingScript.id)"
          >
            Удалить
          </UButton>

          <!-- Индикатор для глобальных скриптов -->
          <div
            v-else
            class="flex items-center gap-2 text-yellow-600 dark:text-yellow-400"
          >
            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
            <span class="text-sm font-medium"
              >Общий скрипт (только чтение)</span
            >
          </div>

          <div class="flex gap-3">
            <UButton color="neutral" variant="soft" @click="closeViewModal">
              Закрыть
            </UButton>
            <!-- Кнопка редактирования только для пользовательских скриптов -->
            <UButton
              v-if="!viewingScript.isGlobal"
              color="primary"
              icon="i-heroicons-pencil"
              @click="editFromView"
            >
              Редактировать
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { useAuthStore } from "~/store/useAuth";

const auth = useAuthStore();
const toast = useToast();

interface Script {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  isGlobal?: boolean; // Добавляем флаг для глобальных скриптов
}

// Состояния
const scripts = ref<Script[]>([]);
const loading = ref(false);
const showModal = ref(false);
const showViewModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const editingScript = ref<Script | null>(null);
const viewingScript = ref<Script | null>(null);

// Computed properties для разделения скриптов
const userScripts = computed(() =>
  scripts.value.filter((script) => !script.isGlobal)
);
const globalScripts = computed(() =>
  scripts.value.filter((script) => script.isGlobal)
);

// TOAST UI Editor
const editorElement = ref<HTMLElement | null>(null);
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
      placeholder: "Введите текст скрипта...",
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
  } catch (error) {
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

// Форма
const form = ref({
  name: "",
  content: "",
});

// Загрузка скриптов
const loadScripts = async () => {
  try {
    loading.value = true;

    // Загружаем пользовательские скрипты
    const userResponse = (await $fetch("/api/user/scripts/list", {
      method: "GET",
    })) as { status: string; scripts: Script[] };

    // Загружаем глобальные скрипты
    const globalResponse = (await $fetch("/api/scripts/global", {
      method: "GET",
    })) as { status: string; scripts: Script[] };

    const userScripts =
      userResponse.status === "success" ? userResponse.scripts : [];
    const globalScripts =
      globalResponse.status === "success"
        ? globalResponse.scripts.map((script) => ({
            ...script,
            isGlobal: true, // Помечаем как глобальный
          }))
        : [];

    // Объединяем скрипты: сначала пользовательские, потом глобальные
    scripts.value = [...userScripts, ...globalScripts];
  } catch (error) {
    console.error("Ошибка загрузки скриптов:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить скрипты",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна для создания
const openCreateModal = async () => {
  isEditing.value = false;
  editingScript.value = null;
  form.value = { name: "", content: "" };
  showModal.value = true;

  // Инициализируем редактор после открытия модального окна
  await nextTick();
  setTimeout(initEditor, 100);
};

// Редактирование скрипта
const editScript = async (script: Script) => {
  isEditing.value = true;
  editingScript.value = script;
  form.value = { name: script.name, content: script.content };
  showModal.value = true;

  // Инициализируем редактор и устанавливаем содержимое
  await nextTick();
  setTimeout(() => {
    initEditor();
    setTimeout(() => setEditorContent(script.content), 200);
  }, 100);
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  form.value = { name: "", content: "" };
  editingScript.value = null;
  isEditing.value = false;

  // Уничтожаем редактор при закрытии
  destroyEditor();
};

// Сохранение скрипта
const saveScript = async () => {
  try {
    saving.value = true;

    // Получаем содержимое из редактора
    const content = getEditorContent();

    const endpoint = isEditing.value
      ? "/api/user/scripts/update"
      : "/api/user/scripts/create";
    const payload = isEditing.value
      ? { id: editingScript.value?.id, name: form.value.name, content }
      : { name: form.value.name, content };

    const response = (await $fetch(endpoint, {
      method: "POST",
      body: payload,
    })) as { status: string; message: string; script?: Script };

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: response.message,
        color: "success",
      });

      closeModal();
      await loadScripts();
    } else {
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    console.error("Ошибка сохранения скрипта:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Не удалось сохранить скрипт";
    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

// Удаление скрипта
const deleteScript = async (id: number) => {
  try {
    const response = (await $fetch("/api/user/scripts/delete", {
      method: "POST",
      body: { id },
    })) as { status: string; message: string };

    if (response.status === "success") {
      toast.add({
        title: "Успешно",
        description: response.message,
        color: "success",
      });

      // Закрываем боковую панель если удаляется просматриваемый скрипт
      if (viewingScript.value?.id === id) {
        closeViewModal();
      }

      await loadScripts();
    } else {
      throw new Error(response.message);
    }
  } catch (error: unknown) {
    console.error("Ошибка удаления скрипта:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Не удалось удалить скрипт";
    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  }
};

// Просмотр скрипта
const viewScript = async (script: Script) => {
  viewingScript.value = script;
  showViewModal.value = true;

  // Инициализируем viewer после открытия панели
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

// Редактирование из модального окна просмотра
const editFromView = () => {
  if (viewingScript.value) {
    // Сохраняем ссылку на скрипт перед закрытием панели
    const scriptToEdit = viewingScript.value;
    // Закрываем боковую панель
    closeViewModal();
    // Открываем модальное окно редактирования с сохраненной ссылкой
    editScript(scriptToEdit);
  }
};

// Полное форматирование даты для боковой панели
const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Инициализация
onMounted(async () => {
  await auth.checkAuth();
  if (auth.isAuthenticated) {
    await loadScripts();
  }
});
</script>

<style lang="css" scoped>
/* import tailwind css */

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

/* Стили для содержимого скрипта в боковой панели */
.script-content {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  line-height: 1.7;
  color: rgb(55 65 81);
  font-size: 16px;
}

.dark .script-content {
  color: rgb(209 213 219);
}

/* Заголовки в содержимом скрипта */
.script-content h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin-bottom: 1.5rem;
  margin-top: 2rem;
  line-height: 1.2;
  border-bottom: 2px solid rgb(229 231 235);
  padding-bottom: 0.5rem;
}

.dark .script-content h1 {
  color: rgb(243 244 246);
  border-bottom-color: rgb(75 85 99);
}

.script-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(31 41 55);
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  line-height: 1.3;
}

.dark .script-content h2 {
  color: rgb(229 231 235);
}

.script-content h3 {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgb(55 65 81);
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
  line-height: 1.4;
}

.dark .script-content h3 {
  color: rgb(209 213 219);
}

/* Параграфы */
.script-content p {
  margin-bottom: 1.25rem;
  line-height: 1.7;
  text-align: justify;
}

.script-content p:last-child {
  margin-bottom: 0;
}

/* Жирный и курсивный текст */
.script-content strong,
.script-content b {
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .script-content strong,
.dark .script-content b {
  color: rgb(243 244 246);
}

.script-content em,
.script-content i {
  font-style: italic;
  color: rgb(75 85 99);
}

.dark .script-content em,
.dark .script-content i {
  color: rgb(156 163 175);
}

/* Списки */
.script-content ul,
.script-content ol {
  margin-bottom: 1.25rem;
  padding-left: 2rem;
}

.script-content ul {
  list-style-type: disc;
}

.script-content ol {
  list-style-type: decimal;
}

.script-content li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.script-content li > ul,
.script-content li > ol {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* Цитаты */
.script-content blockquote {
  border-left: 4px solid rgb(59 130 246);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: rgb(75 85 99);
  background-color: rgb(248 250 252);
  padding: 1rem 1.5rem;
  border-radius: 0 0.5rem 0.5rem 0;
}

.dark .script-content blockquote {
  border-left-color: rgb(96 165 250);
  color: rgb(156 163 175);
  background-color: rgb(30 41 59);
}

/* Код */
.script-content code {
  background-color: rgb(243 244 246);
  color: rgb(239 68 68);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", "Monaco",
    "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}

.dark .script-content code {
  background-color: rgb(55 65 81);
  color: rgb(252 165 165);
}

.script-content pre {
  background-color: rgb(248 250 252);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.25rem 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", "Monaco",
    "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.dark .script-content pre {
  background-color: rgb(30 41 59);
  border-color: rgb(75 85 99);
  color: rgb(203 213 225);
}

.script-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

/* Ссылки */
.script-content a {
  color: rgb(37 99 235);
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.3);
  text-underline-offset: 2px;
  transition: all 0.2s ease;
}

.dark .script-content a {
  color: rgb(96 165 250);
  text-decoration-color: rgba(96, 165, 250, 0.3);
}

.script-content a:hover {
  color: rgb(29 78 216);
  text-decoration-color: rgb(29 78 216);
}

.dark .script-content a:hover {
  color: rgb(147 197 253);
  text-decoration-color: rgb(147 197 253);
}

/* Выделение текста */
.script-content mark {
  background-color: rgb(254 240 138);
  color: rgb(92 54 2);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.dark .script-content mark {
  background-color: rgb(120 113 108);
  color: rgb(254 240 138);
}

/* Разделители */
.script-content hr {
  border: none;
  border-top: 2px solid rgb(229 231 235);
  margin: 2rem 0;
}

.dark .script-content hr {
  border-top-color: rgb(75 85 99);
}

/* Первая буква абзаца (drop cap) для особых случаев */
.script-content .drop-cap::first-letter {
  font-size: 3rem;
  font-weight: 700;
  float: left;
  line-height: 1;
  margin-right: 0.5rem;
  margin-top: 0.25rem;
  color: rgb(59 130 246);
}

.dark .script-content .drop-cap::first-letter {
  color: rgb(96 165 250);
}

/* Адаптивность для мобильных устройств */
@media (max-width: 640px) {
  .script-content {
    font-size: 15px;
    line-height: 1.6;
  }

  .script-content h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
  }

  .script-content h2 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    margin-top: 1.25rem;
  }

  .script-content h3 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
  }

  .script-content ul,
  .script-content ol {
    padding-left: 1.5rem;
  }

  .script-content blockquote {
    padding: 0.75rem 1rem;
    margin: 1rem 0;
  }
}

/* Стили для превью скриптов в списке */
.script-preview {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  max-height: 3.5rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* Улучшенные переходы для карточек скриптов */
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
    rgba(59, 130, 246, 0.05) 0%,
    rgba(147, 197, 253, 0.05) 100%
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
    rgba(96, 165, 250, 0.08) 0%,
    rgba(147, 197, 253, 0.08) 100%
  );
}

/* Стили для боковой панели */
:deep(.slideover-panel) {
  width: 45% !important;
  max-width: 45% !important;
  min-width: 400px !important;
}

@media (max-width: 1024px) {
  :deep(.slideover-panel) {
    width: 60% !important;
    max-width: 60% !important;
    min-width: 350px !important;
  }
}

@media (max-width: 768px) {
  :deep(.slideover-panel) {
    width: 85% !important;
    max-width: 85% !important;
    min-width: 300px !important;
  }
}

@media (max-width: 640px) {
  :deep(.slideover-panel) {
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 100vw !important;
  }
}
</style>
