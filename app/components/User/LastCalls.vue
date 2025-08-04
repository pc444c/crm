<template>
  <div
    class="flex flex-col gap-4 bg-neutral-800 rounded-lg p-4 shadow-lg border border-neutral-700"
  >
    <h2 class="text-lg font-semibold text-primary-400">История звонков</h2>
    <div
      class="flex flex-col md:flex-r // Получаем все доступные теги if (response.tags && response.tags.length > 0) { tags.value = response.tags; } // Записываем звонки в state независимо от наличия тегов calls.value = filteredCalls;ter justify-between gap-4"
    >
      <!-- Фильтры и сортировка -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Фильтр по статусу -->

        <!-- Направление сортировки -->
        <UButton
          size="sm"
          color="gray"
          :icon="
            sortOrder === 'desc'
              ? 'i-heroicons-arrow-down'
              : 'i-heroicons-arrow-up'
          "
          @click="toggleSortOrder"
        />

        <!-- Фильтр по дате -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton size="sm" color="gray" icon="i-heroicons-calendar">
            {{ dateFilter ? "Фильтр даты активен" : "Фильтр по дате" }}
          </UButton>

          <template #panel>
            <div class="p-4 flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">С даты:</label>
                <UInput v-model="dateFrom" type="date" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">По дату:</label>
                <UInput v-model="dateTo" type="date" />
              </div>
              <div class="flex gap-2 justify-end">
                <UButton size="xs" color="gray" @click="clearDateFilter"
                  >Сбросить</UButton
                >
                <UButton size="xs" color="primary" @click="applyDateFilter"
                  >Применить</UButton
                >
              </div>
            </div>
          </template>
        </UPopover>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl" />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="calls.length === 0" class="text-center py-8 text-gray-400">
      Нет доступных записей
    </div>

    <!-- Таблица со звонками -->
    <div v-else class="overflow-auto rounded-md shadow-md">
      <table class="min-w-full text-sm text-left text-gray-400">
        <thead
          class="bg-neutral-900 text-gray-300 uppercase text-xs sticky top-0 z-10"
        >
          <tr>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3">ФИО</th>
            <th class="px-4 py-3">Номер телефона</th>
            <th class="px-4 py-3">Комментарий</th>
            <th class="px-4 py-3">Дата статуса</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-700 bg-neutral-800">
          <tr
            v-for="(call, idx) in calls"
            :key="idx"
            class="hover:bg-neutral-700"
          >
            <td class="px-4 py-3 flex items-center gap-2">
              <!-- Используем универсальный компонент TagButton -->
              <TagButton
                v-if="call.tag"
                :text="call.tag"
                :tooltip-text="tagUtils.getTagAbout(call.tag, tags)"
                :color="tagUtils.getTagActualColor(call.tag, tags)"
                class="text-xs"
              />
              <span v-else class="text-white">Без статуса</span>
            </td>
            <td class="px-4 py-3 text-white">{{ call.fio || "Н/Д" }}</td>
            <td class="px-4 py-3 font-mono text-white">
              {{ call.phone || "Н/Д" }}
            </td>
            <td class="px-4 py-3 text-white truncate max-w-[200px]">
              {{ call.description || "Нет комментария" }}
            </td>
            <td class="px-4 py-3 font-mono text-white">
              {{ formatDate(call.status_updated_at) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Пагинация -->
      <div
        class="flex justify-between items-center bg-neutral-900 px-4 py-3 rounded-b-md border-t border-neutral-700"
      >
        <div class="text-sm text-gray-400">
          Показано:
          {{ currentPage === 1 ? 1 : (currentPage - 1) * limit + 1 }} -
          {{ Math.min(currentPage * limit, totalRecords) }} из
          {{ totalRecords }}
        </div>
        <div class="flex gap-2">
          <UButton
            size="sm"
            color="primary"
            variant="ghost"
            icon="i-heroicons-chevron-left"
            :disabled="currentPage === 1"
            @click="prevPage"
          />
          <UButton
            size="sm"
            color="primary"
            variant="ghost"
            icon="i-heroicons-chevron-right"
            :disabled="currentPage * limit >= totalRecords"
            @click="nextPage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuthStore } from "~/store/useAuth";
import { formatFullDate } from "~/utils/dates";
import * as tagUtils from "~/utils/tags";
import TagButton from "~/components/ui/TagButton.vue";

const auth = useAuthStore();
const toast = useToast();

// Состояния
const isLoading = ref(false);
const calls = ref([]);
const tags = ref([]);
const limit = ref(50); // Увеличиваем лимит для отображения большего количества записей
const currentPage = ref(1);
const totalRecords = ref(0);
const filterStatus = ref(null);
const sortField = ref("dateStatus");
const sortOrder = ref("desc");
const dateFrom = ref("");
const dateTo = ref("");
const dateFilter = ref(false);

// Вычисляемые свойства
const offset = computed(() => (currentPage.value - 1) * limit.value);

// Оставляем на случай будущего использования, добавляем префикс _ чтобы избежать линт-ошибок
const _tagOptions = computed(() => {
  // Добавляем опцию "Все" в начало списка
  return [
    { value: null, label: "Все статусы" },
    ...tags.value.map((tag) => ({
      value: tag.name,
      label: tag.name,
      color: tag.color,
    })),
  ];
});

// Оставляем на случай будущего использования, добавляем префикс _ чтобы избежать линт-ошибок
const _sortOptions = computed(() => [
  { value: "dateStatus", label: "По дате статуса" },
  { value: "dateAssign", label: "По дате назначения" },
  { value: "fio", label: "По ФИО" },
  { value: "phone", label: "По телефону" },
]);

// Методы
function formatDate(dateStr) {
  if (!dateStr) return "Н/Д";
  return formatFullDate(dateStr, "ru-RU", "Н/Д");
}

// Переключение направления сортировки
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
  loadCalls();
}

// Применение фильтра по дате
function applyDateFilter() {
  dateFilter.value = Boolean(dateFrom.value || dateTo.value);
  loadCalls();
}

// Сброс фильтра по дате
function clearDateFilter() {
  dateFrom.value = "";
  dateTo.value = "";
  dateFilter.value = false;
  loadCalls();
}

// Удаляем неиспользуемую функцию getContrastColor, так как теперь всегда используем белый текст

async function loadCalls() {
  // Проверяем актуальность аутентификации перед API-запросом
  await auth.checkAuth();

  if (!auth.getId || !auth.isAuthenticated) return;

  isLoading.value = true;

  try {
    const response = await $fetch("/api/user/getLastCalls", {
      method: "POST",
      body: {
        userId: auth.getId,
        limit: limit.value,
        offset: offset.value,
        filterStatus: filterStatus.value,
        sortBy: sortField.value,
        sortOrder: sortOrder.value,
        dateFrom: dateFrom.value || undefined,
        dateTo: dateTo.value || undefined,
      },
    });

    if (response.success) {
      // Фильтруем записи, исключая те, у которых tag = "no used"
      const filteredCalls = (response.records || []).filter(
        (call) => call.tag !== "no used"
      );

      // Используем общее количество записей из ответа API для пагинации
      totalRecords.value = response.total || 0;

      // Получаем все доступные теги
      if (response.tags && response.tags.length > 0) {
        tags.value = response.tags;

        // Добавляем информацию о теге к каждому звонку
        calls.value = filteredCalls.map((call) => {
          const tagInfo = tags.value.find((tag) => tag.name === call.tag);
          return {
            ...call,
            tagInfo: tagInfo || null,
          };
        });
      } else {
        calls.value = filteredCalls;
      }
    } else {
      toast.add({
        title: "Ошибка",
        description: response.error || "Не удалось загрузить историю звонков",
        color: "error",
      });
      calls.value = [];
    }
  } catch (error) {
    console.error("Ошибка при загрузке истории звонков:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить историю звонков",
      color: "error",
    });
    calls.value = [];
  } finally {
    isLoading.value = false;
  }
}

function nextPage() {
  if (currentPage.value * limit.value < totalRecords.value) {
    currentPage.value++;
    // Прокручиваем вверх для удобства пользователя
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadCalls();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    // Прокручиваем вверх для удобства пользователя
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadCalls();
  }
}

// Обработчик события обновления списка звонков
function handleCallListUpdate() {
  loadCalls();
}

// Инициализация
onMounted(async () => {
  // Проверяем аутентификацию перед загрузкой данных
  await auth.checkAuth();

  // Если пользователь аутентифицирован, загружаем данные и устанавливаем слушатель события
  if (auth.isAuthenticated) {
    loadCalls();
    // Добавляем слушатель события обновления списка звонков
    window.addEventListener("call-list-updated", handleCallListUpdate);
  }
});

// Очистка при размонтировании
onUnmounted(() => {
  window.removeEventListener("call-list-updated", handleCallListUpdate);
});
</script>
