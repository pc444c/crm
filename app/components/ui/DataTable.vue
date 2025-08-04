<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="headerIcon" class="text-primary" />
          <span class="font-semibold">
            {{ title }} ({{ totalItems }})
            <span
              v-if="totalPages > 1"
              class="text-gray-500 dark:text-gray-400 font-normal"
            >
              - Стр. {{ currentPage }} из {{ totalPages }}
            </span>
            <span class="text-gray-500 dark:text-gray-400 font-normal">
              - Показано: {{ paginatedItems.length }} из
              {{ filteredItems.length }}
            </span>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UInput
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            icon="i-heroicons-magnifying-glass"
            class="w-64"
          />
          <UButton
            v-if="showExport"
            icon="i-heroicons-arrow-down-tray"
            color="success"
            variant="outline"
            @click="$emit('export')"
          >
            Экспорт
          </UButton>
        </div>
      </div>
    </template>

    <!-- Таблица -->
    <div v-if="paginatedItems.length > 0" class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr
              class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              <th
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="{ 'cursor-pointer': column.sortable }"
                @click="column.sortable && toggleSort(column.key)"
              >
                <div class="flex items-center gap-1">
                  {{ column.label }}
                  <UIcon
                    v-if="column.sortable && sortBy === column.key"
                    :name="
                      sortOrder === 'asc'
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="w-3 h-3"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr
              v-for="(item, index) in paginatedItems"
              :key="(item.id as string) || (item.phone as string) || index"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 whitespace-nowrap text-sm"
                :class="column.class || 'text-gray-900 dark:text-gray-100'"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :item="item"
                  :value="getNestedValue(item, column.key)"
                >
                  {{ formatValue(item, column) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!loading" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-table-cells" class="mx-auto h-12 w-12 mb-4" />
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>

    <!-- Пагинация -->
    <div
      v-if="filteredItems.length > 0"
      class="flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-b-md border-t border-gray-200 dark:border-gray-700 gap-3"
    >
      <!-- Информация о записях -->
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Показано:
        {{ currentPage === 1 ? 1 : (currentPage - 1) * pageSize + 1 }} -
        {{ Math.min(currentPage * pageSize, filteredItems.length) }} из
        {{ filteredItems.length }} записей
      </div>

      <!-- Кнопки пагинации -->
      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <!-- Первая страница -->
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-double-left"
          title="Первая страница"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        />

        <!-- Предыдущая страница -->
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          title="Предыдущая страница"
          :disabled="currentPage === 1"
          @click="prevPage"
        />

        <!-- Номера страниц -->
        <div class="flex gap-1">
          <template v-for="page in visiblePages" :key="page">
            <UButton
              v-if="page !== '...'"
              size="sm"
              :color="currentPage === page ? 'primary' : 'neutral'"
              :variant="currentPage === page ? 'solid' : 'ghost'"
              class="min-w-[36px]"
              :title="`Страница ${page}`"
              @click="goToPage(page as number)"
            >
              {{ page }}
            </UButton>
            <span
              v-else
              class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          </template>
        </div>

        <!-- Быстрый переход к странице (только для больших таблиц) -->
        <div v-if="totalPages > 10" class="flex items-center gap-2 ml-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">Стр.:</span>
          <UInput
            v-model="pageInput"
            type="number"
            :min="1"
            :max="totalPages"
            size="sm"
            class="w-16"
            @keyup.enter="goToInputPage"
            @blur="goToInputPage"
          />
        </div>

        <!-- Следующая страница -->
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-right"
          title="Следующая страница"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        />

        <!-- Последняя страница -->
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-double-right"
          title="Последняя страница"
          :disabled="currentPage >= totalPages"
          @click="goToPage(totalPages)"
        />
      </div>

      <!-- Если только одна страница, показываем инфо -->
      <div v-else class="text-sm text-gray-500 dark:text-gray-400">
        Все записи на одной странице
      </div>


      <!-- Размер страницы -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-gray-400">Показать:</span>
        <USelect
          v-model="selectedPageSize"
          :options="pageSizeOptions"
          size="sm"
          class="w-20"
        />
      </div>

    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  class?: string;
  formatter?: (value: unknown, item: Record<string, unknown>) => string;
}

interface Props {
  items: Record<string, unknown>[];
  columns: Column[];
  title?: string;
  headerIcon?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  showExport?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Таблица",
  headerIcon: "i-heroicons-table-cells",
  searchKey: "phone",
  searchPlaceholder: "Поиск...",
  pageSize: 20,
  loading: false,
  emptyMessage: "Нет данных для отображения",
  showExport: false,
});

const emit = defineEmits<{
  export: [];
  pageChange: [page: number];
}>();

// Реактивные переменные
const searchQuery = ref("");
const currentPage = ref(1);
const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");

const pageInput = ref("");


const selectedPageSize = ref(props.pageSize);


// Опции размера страницы
const pageSizeOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];


// Вычисляемые свойства
const totalItems = computed(() => props.items.length);

const filteredItems = computed(() => {
  let items = [...props.items];

  // Поиск
  if (searchQuery.value && props.searchKey) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter((item) => {
      const searchValue = getNestedValue(item, props.searchKey!) || "";
      return String(searchValue).toLowerCase().includes(query);
    });
  }

  // Сортировка
  if (sortBy.value) {
    items.sort((a, b) => {
      const aVal = getNestedValue(a, sortBy.value) || "";
      const bVal = getNestedValue(b, sortBy.value) || "";

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder.value === "asc" ? comparison : -comparison;
    });
  }

  return items;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return filteredItems.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredItems.value.length / props.pageSize)
);

// Видимые номера страниц для пагинации
const visiblePages = computed(() => {
  const current = currentPage.value;
  const total = totalPages.value;
  const delta = 2; // Количество страниц с каждой стороны от текущей

  const pages: (number | string)[] = [];

  if (total <= 7) {
    // Если страниц мало, показываем все
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Всегда показываем первую страницу
    pages.push(1);

    if (current > delta + 2) {
      pages.push("...");
    }

    // Страницы вокруг текущей
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - delta - 1) {
      pages.push("...");
    }

    // Всегда показываем последнюю страницу
    if (total > 1) {
      pages.push(total);
    }
  }

  return pages;
});

// Методы
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

function formatValue(item: Record<string, unknown>, column: Column): string {
  const value = getNestedValue(item, column.key);

  if (column.formatter) {
    return column.formatter(value, item);
  }

  if (value === null || value === undefined) {
    return "Н/Д";
  }

  return String(value);
}

function toggleSort(column: string) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortOrder.value = "asc";
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    emit("pageChange", currentPage.value);
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    emit("pageChange", currentPage.value);
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    pageInput.value = String(page);
    emit("pageChange", currentPage.value);
  }
}

function goToInputPage() {
  const page = parseInt(pageInput.value);
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    goToPage(page);
  } else {
    // Возвращаем к текущей странице если ввод некорректный
    pageInput.value = String(currentPage.value);
  }
}

// Сброс пагинации при поиске
watch(searchQuery, () => {
  currentPage.value = 1;
  pageInput.value = "1";
});


// Сброс пагинации при изменении размера страницы
watch(selectedPageSize, () => {
  currentPage.value = 1;
  pageInput.value = "1";
});

// Синхронизация поля ввода с текущей страницей
watch(currentPage, (newPage) => {
  pageInput.value = String(newPage);
});

// Инициализация pageInput
onMounted(() => {
  pageInput.value = String(currentPage.value);
});
</script>
