<template>
  <div class="flex flex-col gap-4 w-full">
    <UCard>
      <div class="flex justify-between items-center mb-4">
        <USeparator color="primary" label="Фильтр записей по тегам" />
        <USelect
          v-model="selectedTag"
          :options="tagsOptions"
          placeholder="Выберите тег"
          class="w-1/3"
          @change="fetchRecords"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <UChip
          v-for="tag in tags"
          :key="tag.id"
          :color="tag.color"
          :text-color="getContrastColor(tag.color)"
          variant="solid"
          :class="{ 'opacity-50': selectedTag !== tag.id }"
          @click="selectTag(tag.id)"
        >
          {{ tag.name }}
        </UChip>
      </div>

      <UInput
        v-model="searchQuery"
        placeholder="Поиск по записям..."
        size="xl"
        class="mb-4"
        icon="i-heroicons-magnifying-glass"
        @input="handleSearchInput"
      />
    </UCard>

    <UCard>
      <USeparator color="primary" label="Список записей" />

      <div class="overflow-auto">
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
                ФИО
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Телефон
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Город
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тег
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
              v-for="record in records"
              :key="record.id"
              class="hover:bg-neutral-800 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">{{ record.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ record.fio || "Н/Д" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ record.phone || "Н/Д" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ record.city || "Н/Д" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UChip
                  :color="getTagColor(record.tag)"
                  :text-color="getContrastColor(getTagColor(record.tag))"
                  variant="solid"
                  size="sm"
                >
                  {{ record.tag }}
                </UChip>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-tag"
                    size="sm"
                    @click="openTagSelector(record)"
                  />
                  <UButton
                    color="info"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    size="sm"
                    @click="viewRecord(record)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="6" class="text-center py-4 text-gray-500">
                {{ isLoading ? "Загрузка..." : "Записей не найдено" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-500">
          Показано {{ records.length }} из {{ totalRecords }} записей
        </div>
        <UPagination
          v-model="currentPage"
          :total="totalPages"
          :ui="{ wrapper: 'flex items-center gap-1' }"
          @change="handlePageChange"
        />
      </div>
    </UCard>

    <!-- Модальное окно для выбора тега -->
    <UModal v-model="showTagModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">Назначить тег</div>
        </template>

        <div class="flex flex-col gap-4">
          <div>
            <div class="mb-2">Запись:</div>
            <div class="font-semibold">{{ selectedRecord?.fio || "Н/Д" }}</div>
            <div>{{ selectedRecord?.phone || "Н/Д" }}</div>
          </div>

          <div>
            <div class="mb-2">Выберите тег:</div>
            <div class="flex flex-wrap gap-2">
              <UChip
                v-for="tag in tags"
                :key="tag.id"
                :color="tag.color"
                :text-color="getContrastColor(tag.color)"
                variant="solid"
                class="cursor-pointer"
                @click="selectTagForRecord(tag.id)"
              >
                {{ tag.name }}
              </UChip>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" @click="showTagModal = false">
              Отмена
            </UButton>
            <UButton
              color="primary"
              :loading="isUpdating"
              :disabled="!tagForRecord"
              @click="assignTag"
            >
              Назначить
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Модальное окно для просмотра записи -->
    <UModal v-model="showRecordModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">Детали записи</div>
        </template>

        <div v-if="selectedRecord" class="grid grid-cols-2 gap-4">
          <div
            v-for="(value, key) in recordDetails"
            :key="key"
            class="flex flex-col"
          >
            <span class="text-sm text-gray-500">{{ getFieldLabel(key) }}</span>
            <span>{{ value || "Н/Д" }}</span>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="primary" @click="showRecordModal = false">
              Закрыть
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import debounce from "lodash/debounce";

// Состояние
const tags = ref([]);
const records = ref([]);
const isLoading = ref(false);
const isUpdating = ref(false);
const totalRecords = ref(0);
const selectedTag = ref(null);
const selectedRecord = ref(null);
const searchQuery = ref("");
const currentPage = ref(1);
const perPage = ref(10);
const showTagModal = ref(false);
const showRecordModal = ref(false);
const tagForRecord = ref(null);

// Расчетные свойства
const totalPages = computed(() => {
  return Math.ceil(totalRecords.value / perPage.value);
});

const tagsOptions = computed(() => {
  return [
    { label: "Все теги", value: null },
    ...tags.value.map((tag) => ({
      label: tag.name,
      value: tag.id,
    })),
  ];
});

const recordDetails = computed(() => {
  if (!selectedRecord.value) return {};

  const { id, created_at, status_updated_at, used_at, ...details } =
    selectedRecord.value;
  return {
    ...details,
    created_at: formatDate(created_at),
    status_updated_at: status_updated_at ? formatDate(status_updated_at) : null,
    used_at: used_at ? formatDate(used_at) : null,
  };
});

// Методы
async function fetchTags() {
  try {
    const { data } = await useFetch("/api/admin/listtags");
    tags.value = data.value || [];
  } catch (error) {
    console.error("Ошибка при загрузке тегов:", error);
    useToast().add({
      title: "Ошибка",
      description: "Не удалось загрузить теги",
      color: "error",
    });
  }
}

async function fetchRecords() {
  isLoading.value = true;

  try {
    const offset = (currentPage.value - 1) * perPage.value;

    const { data } = await useFetch("/api/records/getByTag", {
      method: "POST",
      body: {
        tagId: selectedTag.value,
        searchQuery: searchQuery.value,
        limit: perPage.value,
        offset,
      },
    });

    if (data.value && data.value.status === "success") {
      records.value = data.value.data || [];
      totalRecords.value = data.value.pagination?.total || 0;
    } else {
      records.value = [];
      totalRecords.value = 0;
      console.error("Ошибка получения записей:", data.value);
    }
  } catch (error) {
    console.error("Ошибка при загрузке записей:", error);
    useToast().add({
      title: "Ошибка",
      description: "Не удалось загрузить записи",
      color: "error",
    });
    records.value = [];
    totalRecords.value = 0;
  } finally {
    isLoading.value = false;
  }
}

const handleSearchInput = debounce(() => {
  currentPage.value = 1;
  fetchRecords();
}, 500);

function handlePageChange(_page) {
  fetchRecords();
}

function selectTag(tagId) {
  selectedTag.value = selectedTag.value === tagId ? null : tagId;
  currentPage.value = 1;
  fetchRecords();
}

function openTagSelector(record) {
  selectedRecord.value = record;
  tagForRecord.value = null;
  showTagModal.value = true;
}

function viewRecord(record) {
  selectedRecord.value = record;
  showRecordModal.value = true;
}

function selectTagForRecord(tagId) {
  tagForRecord.value = tagId;
}

async function assignTag() {
  if (!selectedRecord.value || !tagForRecord.value) return;

  isUpdating.value = true;

  try {
    const { data } = await useFetch("/api/records/setTag", {
      method: "POST",
      body: {
        recordId: selectedRecord.value.id,
        tagId: tagForRecord.value,
      },
    });

    if (data.value && data.value.status === "success") {
      useToast().add({
        title: "Успех",
        description: "Тег успешно назначен",
        color: "success",
      });

      showTagModal.value = false;
      fetchRecords();
    } else {
      useToast().add({
        title: "Ошибка",
        description: data.value?.message || "Не удалось назначить тег",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Ошибка при назначении тега:", error);
    useToast().add({
      title: "Ошибка",
      description: "Не удалось назначить тег",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
}

function getTagColor(tagName) {
  const tag = tags.value.find((t) => t.name === tagName);
  return tag ? tag.color : "#9CA3AF";
}

function getContrastColor(bgColor) {
  if (!bgColor) return "white";

  // Простой алгоритм для определения контрастного цвета
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "black" : "white";
}

function getFieldLabel(key) {
  const labels = {
    fio: "ФИО",
    phone: "Телефон",
    city: "Город",
    region: "Регион",
    address: "Адрес",
    age: "Возраст",
    timezone: "Часовой пояс",
    tag: "Тег",
    description: "Описание",
    created_at: "Дата создания",
    status_updated_at: "Дата обновления статуса",
    used_at: "Дата использования",
    custom1: "Доп. поле 1",
    custom2: "Доп. поле 2",
    custom3: "Доп. поле 3",
  };

  return labels[key] || key;
}

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

// Инициализация
onMounted(() => {
  fetchTags();
  fetchRecords();
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
