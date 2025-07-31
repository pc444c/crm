<template>
  <div class="flex flex-col gap-4">
    <USeparator color="primary" label="История звонков" />
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                <UInput type="date" v-model="dateFrom" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">По дату:</label>
                <UInput type="date" v-model="dateTo" />
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
    <div v-else class="overflow-auto rounded-md">
      <table class="min-w-full text-sm text-left text-gray-400">
        <thead class="bg-neutral-900 text-gray-300 uppercase text-xs">
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
              <div
                v-if="call.tagInfo"
                :style="{ backgroundColor: call.tagInfo.color }"
                class="w-3 h-3 rounded-full"
              ></div>
              <span class="text-white">{{ call.tag || "Не назначен" }}</span>
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
      <div class="flex justify-between items-center bg-neutral-900 px-4 py-3">
        <div class="text-sm text-gray-400">
          Показано: {{ Math.min(limit, calls.length) }} из {{ totalRecords }}
        </div>
        <div class="flex gap-2">
          <UButton
            size="sm"
            :disabled="currentPage === 1"
            @click="prevPage"
            icon="i-heroicons-chevron-left"
          />
          <UButton
            size="sm"
            :disabled="currentPage * limit >= totalRecords"
            @click="nextPage"
            icon="i-heroicons-chevron-right"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuthStore } from "~/store/useAuth";

const auth = useAuthStore();
const toast = useToast();

// Состояния
const isLoading = ref(false);
const calls = ref([]);
const tags = ref([]);
const limit = ref(10);
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

const tagOptions = computed(() => {
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

const sortOptions = computed(() => [
  { value: "dateStatus", label: "По дате статуса" },
  { value: "dateAssign", label: "По дате назначения" },
  { value: "fio", label: "По ФИО" },
  { value: "phone", label: "По телефону" },
]);

// Методы
function formatDate(dateStr) {
  if (!dateStr) return "Н/Д";

  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Некорректная дата";

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
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
      calls.value = (response.records || []).filter(call => call.tag !== "no used" && call.tag !== "no used");
      totalRecords.value = calls.value.length; // Обновляем общее количество после фильтрации

      if (response.tags && response.tags.length > 0) {
        tags.value = response.tags;
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
    loadCalls();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
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
