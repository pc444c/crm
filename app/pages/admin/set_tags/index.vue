<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard>
      <USeparator
        :color="editId ? 'warning' : 'primary'"
        :label="editId ? 'Редактирование тега' : 'Добавление тега'"
        class="mb-4"
      />
      <div class="flex flex-col gap-4 items-center w-1/2 mx-auto">
        <UFormGroup label="Название тега">
          <UInput
            v-model="tagName"
            size="xl"
            placeholder="Введите название тега"
          />
        </UFormGroup>

        <UFormGroup label="Описание">
          <UInput
            v-model="tagAbout"
            size="xl"
            placeholder="Описание (не обязательно)"
          />
        </UFormGroup>

        <UFormGroup label="Цвет тега">
          <div class="flex items-center gap-3">
            <UColorPicker v-model="tagColor" />
          </div>
        </UFormGroup>

        <div
          v-if="tagName"
          class="text-sm px-3 py-1 mb-2 rounded-full inline-flex items-center"
          :style="{ backgroundColor: tagColor, color: 'white' }"
        >
          {{ tagName }}
        </div>

        <div class="flex gap-4">
          <UButton
            color="primary"
            size="xl"
            :loading="isLoading"
            :disabled="!tagName"
            @click="handleSubmit"
          >
            {{ editId ? "Сохранить изменения" : "Добавить тег" }}
          </UButton>
          <UButton v-if="editId" color="neutral" size="xl" @click="cancelEdit">
            Отмена
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2 flex-1">
          
          <UButton
            color="primary"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            :loading="isLoading"
            :disabled="isLoading"
            size="sm"
            class="shrink-0"
            @click="fetchTags"
          >
            Обновить
          </UButton>
        </div>
        <UInput
          v-model="searchQuery"
          placeholder="Поиск по тегам..."
          size="xl"
          class="w-1/3"
          icon="i-heroicons-magnifying-glass"
        />
      </div>

      <div class="overflow-auto">
        <!-- Отладочная информация -->
        <div
          class="mb-4 text-sm p-2 rounded"
          :class="hasError ? 'bg-red-500' : 'bg-neutral-900'"
        >
          <div class="flex justify-between mb-1">
            <span>Состояние:</span>
            <span
              class="font-bold"
              :class="hasError ? 'text-red-600' : 'text-green-600'"
            >
              {{
                hasError
                  ? "Ошибка загрузки"
                  : isLoading
                  ? "Загрузка..."
                  : "Загружено успешно"
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Всего тегов:</span>
            <span class="font-bold">{{ tags.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>Отфильтровано:</span>
            <span class="font-bold">{{ filteredTags.length }}</span>
          </div>
          <div
            v-if="!hasError && !isLoading && tags.length === 0"
            class="mt-1 text-yellow-600"
          >
            Теги отсутствуют в базе данных. Добавьте первый тег!
          </div>
          <div v-if="hasError" class="mt-1 text-red-600">
            Ошибка при загрузке данных. Проверьте консоль для получения
            дополнительной информации.
          </div>
        </div>
        <USeparator color="primary" label="Список тегов" />
        <!-- Обычная таблица для отладки -->
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-neutral-900">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Цвет
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Название
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Описание
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-neutral-900 divide-y divide-gray-200">
            <tr
              v-for="(tag, index) in filteredTags"
              :key="tag.id || index"
              class="hover:bg-neutral-800 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">{{ tag.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full"
                    :style="{ backgroundColor: tag.color }"
                  />
                  <span class="text-xs">{{ tag.color }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-semibold flex items-center gap-2">
                  {{ tag.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span v-if="tag.about">{{ tag.about }}</span>
                  <span v-else class="text-gray-400 italic">Нет описания</span>
                  <UTooltip v-if="tag.about" :text="tag.about">
                    <UIcon
                      name="i-heroicons-information-circle"
                      class="text-gray-400"
                    />
                  </UTooltip>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    @click="startEdit(tag)"
                  />
                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="confirmDelete(tag)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="filteredTags.length === 0">
              <td colspan="5" class="text-center py-4 text-gray-500">
                {{
                  tags.length
                    ? "Тегов не найдено по запросу: " + searchQuery
                    : "Список тегов пуст"
                }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="isLoading">
            <tr>
              <td colspan="5" class="text-center py-4">
                <div class="flex justify-center">Загрузка...</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </UCard>

    <!-- Модальное окно подтверждения удаления -->
    
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";

// Интерфейсы для тега и ответа API
interface Tag {
  id: number;
  name: string;
  about: string | null;
  color: string;
  created_at: string;
}

interface ApiResponse {
  status: string;
  message?: string;
  tag?: Tag;
}

// Состояние формы
const tagName = ref("");
const tagAbout = ref("");
const tagColor = ref("#3B82F6"); // Default blue color
const editId = ref<number | null>(null);

// Состояние таблицы и поиска
const tags = ref<Tag[]>([]);
const searchQuery = ref("");
const isLoading = ref(false);
const isDeleting = ref(false);
const hasError = ref(false);

// Состояние модального окна удаления
const showDeleteModal = ref(false);
const tagToDelete = ref<Tag | null>(null);

// Колонки для таблицы убраны, т.к. используется обычная таблица

// Toast уведомления
const toast = useToast();

// Фильтрация тегов по поисковому запросу
const filteredTags = computed(() => {
  console.log("Вычисляем фильтрованные теги, всего тегов:", tags.value.length);

  // Защита от null/undefined
  if (!tags.value || !Array.isArray(tags.value)) {
    console.warn("tags.value не является массивом:", tags.value);
    return [];
  }

  if (!searchQuery.value) return tags.value;

  const query = searchQuery.value.toLowerCase();
  const filtered = tags.value.filter(
    (tag) =>
      tag &&
      (tag.name?.toLowerCase().includes(query) ||
        (tag.about && tag.about.toLowerCase().includes(query)))
  );

  console.log(
    `Отфильтровано ${filtered.length} тегов по запросу: "${searchQuery.value}"`
  );
  return filtered;
});

// Загрузка списка тегов
async function fetchTags() {
  console.log("===== НАЧАЛО ЗАГРУЗКИ ТЕГОВ =====");
  isLoading.value = true;
  hasError.value = false;

  try {
    console.log("Отправляем запрос к API...");
    // Использование useFetch вместо $fetch для более детальной отладки
    const { data, error } = await useFetch("/api/admin/listtags", {
      // Включаем raw для полного доступа к ответу
      key: `tags-${new Date().getTime()}`,
      server: false,
    });

    console.log("Ответ получен:", data.value);
    console.log("Ошибка запроса:", error.value);

    if (error.value) {
      hasError.value = true;
      console.error("Ошибка API:", error.value);
      toast.add({
        title: "Ошибка сервера",
        description: "Не удалось получить список тегов",
        color: "error",
      });
      return;
    }

    // Проверка, является ли ответ массивом
    if (data.value && Array.isArray(data.value)) {
      console.log(`Получен массив из ${data.value.length} элементов`);
      tags.value = [...data.value]; // Явное создание новой ссылки для реактивности
      console.log("Теги установлены, текущая длина:", tags.value.length);

      // Отладка структуры данных
      if (tags.value.length > 0) {
        console.log(
          "Структура первого тега:",
          JSON.stringify(tags.value[0], null, 2)
        );
      }
    } else {
      console.error(
        "Полученные данные не являются массивом или пусты:",
        data.value
      );
      tags.value = [];

      // Если данные не массив, но есть status="error"
      if (data.value && data.value.status === "error") {
        hasError.value = true;
        toast.add({
          title: "Ошибка сервера",
          description: data.value.message || "Ошибка при получении тегов",
          color: "error",
        });
      }
    }
  } catch (error) {
    hasError.value = true;
    console.error("Критическая ошибка при загрузке тегов:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить список тегов",
      color: "error",
    });
    tags.value = [];
  } finally {
    console.log(
      `Загрузка завершена. Количество тегов: ${tags.value.length}, были ошибки: ${hasError.value}`
    );
    console.log("===== КОНЕЦ ЗАГРУЗКИ ТЕГОВ =====");
    isLoading.value = false;
  }
}

// Сброс формы
function resetForm() {
  tagName.value = "";
  tagAbout.value = "";
  tagColor.value = "#3B82F6";
  editId.value = null;
}

// Отмена редактирования
function cancelEdit() {
  resetForm();
}

// Начало редактирования тега
function startEdit(tag: Tag) {
  editId.value = tag.id;
  tagName.value = tag.name;
  tagAbout.value = tag.about || "";
  tagColor.value = tag.color;

  // Прокрутка к форме редактирования
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Подтверждение удаления
function confirmDelete(tag: Tag) {
  tagToDelete.value = tag;
  showDeleteModal.value = true;
  deleteTag();
  console.log("Подтверждение удаления тега:", tag);
}

// Удаление тега
async function deleteTag() {
  if (!tagToDelete.value) return;

  isDeleting.value = true;
  console.log("=== УДАЛЕНИЕ ТЕГА ===");
  console.log(
    "Удаляем тег с ID:",
    tagToDelete.value.id,
    "и названием:",
    tagToDelete.value.name
  );

  try {
    const { data, error } = await useFetch<ApiResponse>(
      "/api/admin/deletetag",
      {
        method: "POST",
        body: { id: tagToDelete.value.id },
        key: `tag-delete-${new Date().getTime()}`,
        server: false,
      }
    );

    console.log("Ответ API удаления:", data.value);
    console.log("Ошибка API удаления:", error.value);

    if (error.value) {
      toast.add({
        title: "Ошибка сети",
        description: "Не удалось отправить запрос на удаление",
        color: "error",
      });
      console.error("Сетевая ошибка при удалении:", error.value);
      return;
    }

    const response = data.value as ApiResponse;

    if (response && response.status === "success") {
      toast.add({
        title: "Успех",
        description: "Тег успешно удален",
        color: "success",
      });

      await fetchTags();
      showDeleteModal.value = false;
      tagToDelete.value = null;
    } else {
      toast.add({
        title: "Ошибка",
        description: response?.message || "Ошибка при удалении тега",
        color: "error",
      });
      console.error("Ошибка API при удалении:", response);
    }
  } catch (error) {
    console.error("Критическая ошибка при удалении тега:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить тег",
      color: "error",
    });
  } finally {
    console.log("=== ЗАВЕРШЕНИЕ УДАЛЕНИЯ ТЕГА ===");
    isDeleting.value = false;
  }
}

// Добавление или обновление тега
async function handleSubmit() {
  if (!tagName.value) {
    toast.add({
      title: "Внимание",
      description: "Необходимо указать название тега",
      color: "warning",
    });
    return;
  }

  isLoading.value = true;
  console.log("=== ОТПРАВКА ФОРМЫ ТЕГА ===");
  console.log("Режим:", editId.value ? "Редактирование" : "Добавление");

  try {
    const tagData = {
      name: tagName.value.trim(),
      about: tagAbout.value ? tagAbout.value.trim() : null,
      color: tagColor.value,
    };

    console.log("Данные для отправки:", tagData);

    const url = editId.value ? "/api/admin/edittag" : "/api/admin/addtag";
    const body = editId.value ? { id: editId.value, ...tagData } : tagData;

    console.log(`Отправка запроса на ${url}`);
    console.log("Тело запроса:", body);

    const { data, error } = await useFetch<ApiResponse>(url, {
      method: "POST",
      body,
      key: `tag-submit-${new Date().getTime()}`,
      server: false,
    });

    console.log("Ответ API:", data.value);
    console.log("Ошибка API:", error.value);

    if (error.value) {
      toast.add({
        title: "Ошибка сети",
        description: "Не удалось отправить запрос на сервер",
        color: "error",
      });
      console.error("Сетевая ошибка:", error.value);
      return;
    }

    const response = data.value as ApiResponse;

    if (response && response.status === "success") {
      toast.add({
        title: "Успех",
        description: editId.value
          ? "Тег успешно обновлен"
          : "Тег успешно добавлен",
        color: "success",
      });

      // Сбросить форму и обновить список тегов
      resetForm();
      await fetchTags();
    } else {
      toast.add({
        title: "Ошибка",
        description: response?.message || "Ошибка при работе с тегом",
        color: "error",
      });
      console.error("Ошибка API:", response);
    }
  } catch (error) {
    console.error("Критическая ошибка при работе с тегом:", error);
    toast.add({
      title: "Ошибка",
      description: editId.value
        ? "Не удалось обновить тег"
        : "Не удалось добавить тег",
      color: "error",
    });
  } finally {
    console.log("=== ЗАВЕРШЕНИЕ ОТПРАВКИ ФОРМЫ ===");
    isLoading.value = false;
  }
}

// Загрузка данных при монтировании
onMounted(() => {
  console.log("Компонент смонтирован, загружаем теги");
  fetchTags();

  // Добавляем логирование для отладки
  setTimeout(() => {
    console.log("Текущее состояние после загрузки:");
    console.log("Теги:", tags.value);
    console.log("Фильтрованные теги:", filteredTags.value);

    if (tags.value.length > 0) {
      console.log(
        "Структура первого тега:",
        JSON.stringify(tags.value[0], null, 2)
      );
    }
  }, 2000);
});
</script>
