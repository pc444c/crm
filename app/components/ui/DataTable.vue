<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="headerIcon" class="text-primary" />
          <span class="font-semibold">
            {{ title }} ({{ totalItems }}) - Показано:
            {{ paginatedItems.length }} из {{ filteredItems.length }}
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

    <!-- Пагинация в стиле user страницы -->
    <div
      v-if="filteredItems.length > pageSize"
      class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-b-md border-t border-gray-200 dark:border-gray-700"
    >
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Показано:
        {{ currentPage === 1 ? 1 : (currentPage - 1) * pageSize + 1 }} -
        {{ Math.min(currentPage * pageSize, filteredItems.length) }} из
        {{ filteredItems.length }}
      </div>
      <div class="flex gap-2">
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          Пред
        </UButton>
        <span class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <UButton
          size="sm"
          color="primary"
          variant="ghost"
          icon="i-heroicons-chevron-right"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          След
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
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

// Сброс пагинации при поиске
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>
