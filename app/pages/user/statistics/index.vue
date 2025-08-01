<template>
  <div class="p-4 space-y-6">
    <!-- Заголовок и фильтры -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold">Статистика звонков</h1>

      <!-- Быстрый выбор периода -->
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="flex flex-col gap-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
            Быстрый выбор периода:
          </span>
          <div class="flex flex-wrap gap-2">
            <UButton size="sm" variant="outline" @click="setPeriod(1)"
              >Сегодня</UButton
            >
            <UButton size="sm" variant="outline" @click="setPeriod(7)"
              >7 дней</UButton
            >
            <UButton size="sm" variant="outline" @click="setPeriod(30)"
              >30 дней</UButton
            >
            <UButton size="sm" variant="outline" @click="setPeriod(90)"
              >3 месяца</UButton
            >
          </div>
        </div>
      </div>

      <!-- Ручной выбор дат -->
      <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
        <div class="flex flex-col sm:flex-row gap-2">
          <UFormField label="Дата с">
            <UInput
              v-model="filters.startDate"
              type="date"
              icon="i-heroicons-calendar"
            />
          </UFormField>
          <UFormField label="Дата по">
            <UInput
              v-model="filters.endDate"
              type="date"
              icon="i-heroicons-calendar"
            />
          </UFormField>
        </div>
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          :loading="loading"
          @click="loadStatistics"
        >
          Обновить
        </UButton>
      </div>
    </div>

    <!-- Карточки с общей статистикой -->
    <div
      v-if="loading || totalCalls > 0 || filters.startDate || filters.endDate"
      class="grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-phone" class="text-blue-500" />
            <span class="font-semibold">Всего звонков</span>
          </div>
        </template>
        <div class="text-2xl font-bold text-blue-500">
          {{ loading ? "..." : totalCalls }}
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="text-green-500" />
            <span class="font-semibold">Успешных</span>
          </div>
        </template>
        <div class="text-2xl font-bold text-green-500">
          {{ loading ? "..." : successfulCalls }}
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="text-yellow-500" />
            <span class="font-semibold">Сегодня</span>
          </div>
        </template>
        <div class="text-2xl font-bold text-yellow-500">
          {{ loading ? "..." : todayCalls }}
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-purple-500" />
            <span class="font-semibold">Среднее в день</span>
          </div>
        </template>
        <div class="text-2xl font-bold text-purple-500">
          {{ loading ? "..." : averagePerDay }}
        </div>
      </UCard>
    </div>

    <!-- Статистика по тегам -->
    <div
      v-if="loading || totalCalls > 0 || filters.startDate || filters.endDate"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <!-- Статистика по тегам (текстовая) -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-tag" class="text-primary" />
            <span class="font-semibold">Статистика по тегам</span>
          </div>
        </template>

        <div v-if="tagStats.length > 0" class="space-y-3">
          <div
            v-for="stat in tagStats"
            :key="stat.status"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getTagColor(stat.status) }"
              />
              <span class="font-medium">{{ getTagName(stat.status) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold">{{ stat.count }}</span>
              <span class="text-sm text-gray-500">
                ({{ getPercentage(stat.count) }}%)
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-pie" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных по тегам</p>
        </div>
      </UCard>

      <!-- График по дням -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-primary" />
            <span class="font-semibold">Динамика по дням</span>
          </div>
        </template>

        <div v-if="timeSeriesData.length > 0" class="h-64 p-4">
          <canvas
            ref="chartCanvas"
            class="w-full h-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
          <!-- Отладочная информация -->
          <div
            class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center"
          >
            Данных: {{ timeSeriesData.length }}, Пример:
            {{
              timeSeriesData[0]
                ? `${timeSeriesData[0].date}: ${timeSeriesData[0].count}`
                : "нет"
            }}
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных для графика</p>
        </div>
      </UCard>
    </div>

    <!-- Таблица звонков -->
    <UCard v-if="loading || userCalls.length > 0" ref="tableCard">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-table-cells" class="text-primary" />
            <span class="font-semibold">
              История звонков ({{ userCalls.length }}) - Показано:
              {{ paginatedCalls.length }} из {{ filteredCalls.length }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UInput
              v-model="searchQuery"
              placeholder="Поиск по телефону..."
              icon="i-heroicons-magnifying-glass"
              class="w-64"
            />
            <UButton
              icon="i-heroicons-arrow-down-tray"
              color="success"
              variant="outline"
              @click="exportTable"
            >
              Экспорт
            </UButton>
          </div>
        </div>
      </template>

      <!-- Стилизованная таблица -->
      <div v-if="paginatedCalls.length > 0" class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              >
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="toggleSort('id')"
                >
                  <div class="flex items-center gap-1">
                    ID
                    <UIcon
                      v-if="sortBy === 'id'"
                      :name="
                        sortOrder === 'asc'
                          ? 'i-heroicons-chevron-up'
                          : 'i-heroicons-chevron-down'
                      "
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="toggleSort('phone')"
                >
                  <div class="flex items-center gap-1">
                    Телефон
                    <UIcon
                      v-if="sortBy === 'phone'"
                      :name="
                        sortOrder === 'asc'
                          ? 'i-heroicons-chevron-up'
                          : 'i-heroicons-chevron-down'
                      "
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="toggleSort('tag')"
                >
                  <div class="flex items-center gap-1">
                    Тег
                    <UIcon
                      v-if="sortBy === 'tag'"
                      :name="
                        sortOrder === 'asc'
                          ? 'i-heroicons-chevron-up'
                          : 'i-heroicons-chevron-down'
                      "
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="toggleSort('status_updated_at')"
                >
                  <div class="flex items-center gap-1">
                    Дата обновления
                    <UIcon
                      v-if="sortBy === 'status_updated_at'"
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
                v-for="call in paginatedCalls"
                :key="call.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td
                  class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ call.id }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span class="text-gray-900 dark:text-gray-100 font-mono">
                    {{ call.phone }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <div v-if="hasValidTag(call.tag)" class="inline-block">
                    <TagButton
                      :text="getTagName(call.tag)"
                      :color="getTagColor(call.tag)"
                      :tooltip-text="getTagName(call.tag)"
                      class="text-xs"
                    />
                  </div>
                  <span v-else class="text-gray-400 text-sm">Без тега</span>
                </td>
                <td
                  class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ formatDateTime(call.status_updated_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Сообщение о пустом состоянии -->
      <div v-else-if="!loading" class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-table-cells" class="mx-auto h-12 w-12 mb-4" />
        <p>Записи не найдены</p>
      </div>

      <!-- Пагинация -->
      <div
        v-if="filteredCalls.length > pageSize"
        class="flex justify-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <!-- Простая пагинация с кнопками -->
        <div class="flex items-center gap-2">
          <UButton
            :disabled="currentPage <= 1"
            size="sm"
            variant="outline"
            icon="i-heroicons-chevron-left"
            @click="goToPage(1)"
          >
            Первая
          </UButton>

          <UButton
            :disabled="currentPage <= 1"
            size="sm"
            variant="outline"
            icon="i-heroicons-chevron-left"
            @click="prevPage()"
          >
            Пред
          </UButton>

          <span class="px-3 py-2 text-sm">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>

          <UButton
            :disabled="currentPage >= totalPages"
            size="sm"
            variant="outline"
            @click="nextPage()"
          >
            След
            <UIcon name="i-heroicons-chevron-right" class="ml-1" />
          </UButton>

          <UButton
            :disabled="currentPage >= totalPages"
            size="sm"
            variant="outline"
            @click="goToPage(totalPages)"
          >
            Последняя
            <UIcon name="i-heroicons-chevron-right" class="ml-1" />
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { userApi } from "@/utils/api";
import TagButton from "@/components/ui/TagButton.vue";

// Интерфейсы для типизации данных
interface CallStat {
  status: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface UserCall {
  id: number;
  fio: string;
  phone: string;
  tag: string;
  city: string;
  address: string;
  status_updated_at: string;
  created_at: string;
}

interface Tag {
  id: number;
  name: string;
  about: string;
  color: string;
  created_at: string;
}

// Метаданные страницы
useHead({
  title: "Статистика звонков",
});

definePageMeta({
  layout: "user",
});

// Реактивные данные
const loading = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = 20;
const tableCard = ref();
const chartCanvas = ref();
const chartInstance = ref<any>(null);

// Плавная прокрутка к таблице при смене страницы
watch(currentPage, () => {
  nextTick(() => {
    if (tableCard.value) {
      tableCard.value.$el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Сортировка
const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");

// Фильтры
const filters = ref({
  startDate: "",
  endDate: "",
});

// Данные статистики
const statisticsData = ref<{
  callStats: CallStat[];
  timeSeriesData: TimeSeriesData[];
  userCalls: UserCall[];
  tags: Tag[];
}>({
  callStats: [],
  timeSeriesData: [],
  userCalls: [],
  tags: [],
});

// Вычисляемые свойства
const tagStats = computed(() => {
  const stats = statisticsData.value.callStats || [];
  return stats.filter(
    (stat) => stat.status !== "no user" && stat.status !== "no used"
  );
});
const timeSeriesData = computed(
  () => statisticsData.value.timeSeriesData || []
);
const userCalls = computed(() => {
  const calls = statisticsData.value.userCalls || [];
  return calls.filter(
    (call) => call.tag !== "no user" && call.tag !== "no used"
  );
});
const availableTags = computed(() => statisticsData.value.tags || []);

const totalCalls = computed(() => {
  return tagStats.value.reduce((sum, stat) => sum + Number(stat.count), 0);
});

const successfulCalls = computed(() => {
  const successTags = ["ПЕРЕДАТЬ", "ПЕРЕЗВОН"];
  return tagStats.value
    .filter((stat) => successTags.includes(stat.status))
    .reduce((sum, stat) => sum + Number(stat.count), 0);
});

const todayCalls = computed(() => {
  const today = new Date().toISOString().split("T")[0];
  const todayData = timeSeriesData.value.find((data) => data.date === today);
  return todayData ? Number(todayData.count) : 0;
});

const averagePerDay = computed(() => {
  if (timeSeriesData.value.length === 0) return 0;
  const total = timeSeriesData.value.reduce(
    (sum, data) => sum + Number(data.count),
    0
  );
  return Math.round(total / timeSeriesData.value.length);
});

// Фильтрованные звонки для таблицы
const filteredCalls = computed(() => {
  let calls = [...userCalls.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    calls = calls.filter((call) => {
      const phone = call.phone || "";
      return phone.includes(query);
    });
  }

  // Сортировка
  if (sortBy.value) {
    calls.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy.value] || "";
      const bVal = (b as Record<string, unknown>)[sortBy.value] || "";

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

  return calls;
});

// Пагинированные звонки
const paginatedCalls = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredCalls.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredCalls.value.length / pageSize)
);

// Функции для работы с графиком
function createChart() {
  console.log("Создание графика, данных:", timeSeriesData.value.length);

  if (!chartCanvas.value || timeSeriesData.value.length === 0) {
    console.log("Нет канваса или данных");
    return;
  }

  const canvas = chartCanvas.value;
  const ctx = canvas.getContext("2d");

  // Устанавливаем размеры канваса
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const data = timeSeriesData.value;
  const maxValue = Math.max(...data.map((item) => Number(item.count)), 1);
  const padding = 50;
  const chartWidth = rect.width - padding * 2;
  const chartHeight = rect.height - padding * 2;

  console.log("Размеры графика:", {
    width: rect.width,
    height: rect.height,
    maxValue,
  });

  // Определяем цвета для темной/светлой темы
  const isDark = document.documentElement.classList.contains("dark");
  const colors = {
    background: isDark ? "#1f2937" : "#ffffff",
    gridLine: isDark ? "#374151" : "#e5e7eb",
    text: isDark ? "#d1d5db" : "#6b7280",
    primary: "rgb(34, 197, 94)", // green-500
    primaryLight: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
    accent: isDark ? "#f3f4f6" : "#374151",
  };

  // Очищаем канвас
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Рисуем фон
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Рисуем сетку
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;

  // Горизонтальные линии сетки
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i / 5) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();

    // Подписи по оси Y
    ctx.fillStyle = colors.text;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    const value = Math.round(maxValue * (1 - i / 5));
    ctx.fillText(value.toString(), padding - 10, y + 4);
  }

  // Рисуем область под графиком
  if (data.length > 1) {
    const gradient = ctx.createLinearGradient(
      0,
      padding,
      0,
      padding + chartHeight
    );
    gradient.addColorStop(0, colors.primaryLight);
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y =
        padding + chartHeight - (Number(item.count) / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fill();
  }

  // Рисуем линию графика
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  data.forEach((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      padding + chartHeight - (Number(item.count) / maxValue) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Рисуем точки
  data.forEach((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      padding + chartHeight - (Number(item.count) / maxValue) * chartHeight;

    // Внешний круг (белый/темный фон)
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Внутренний круг (основной цвет)
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Подписи значений над точками
    if (Number(item.count) > 0) {
      ctx.fillStyle = colors.accent;
      ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.count.toString(), x, y - 15);
    }
  });

  // Подписи дат
  ctx.fillStyle = colors.text;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  data.forEach((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const date = new Date(item.date);
    const label = date.toLocaleDateString("ru-RU", {
      month: "short",
      day: "numeric",
    });
    ctx.fillText(label, x, rect.height - 15);
  });

  // Добавляем подпись оси Y
  ctx.save();
  ctx.translate(15, padding + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.text;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Количество звонков", 0, 0);
  ctx.restore();

  console.log("График создан");
}

function updateChart() {
  console.log("Обновление графика");
  setTimeout(() => {
    createChart();
  }, 100);
}

// Следим за изменениями данных для обновления графика
watch(
  timeSeriesData,
  (newData) => {
    console.log("Данные изменились:", newData.length);
    updateChart();
  },
  { deep: true }
);

// Создание графика после монтирования
onMounted(() => {
  console.log("Компонент смонтирован");
  window.addEventListener("resize", updateChart);

  // Наблюдаем за изменением темы
  const observer = new MutationObserver(() => {
    updateChart();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Пробуем создать график через небольшую задержку
  setTimeout(updateChart, 500);

  // Сохраняем observer для очистки
  chartInstance.value = observer;
});

onUnmounted(() => {
  window.removeEventListener("resize", updateChart);
  if (chartInstance.value && chartInstance.value.disconnect) {
    chartInstance.value.disconnect();
  }
  chartInstance.value = null;
});

// Методы
function getTagColor(tagName: string): string {
  if (!tagName || tagName === "null" || tagName === "undefined")
    return "#6B7280";
  const tag = availableTags.value.find((t) => t.name === tagName);
  return tag?.color || "#6B7280";
}

function getTagName(tagName: string): string {
  if (!tagName || tagName === "null" || tagName === "undefined")
    return "Не указан";
  const tag = availableTags.value.find((t) => t.name === tagName);
  return tag?.name || tagName;
}

function hasValidTag(tagName: string): boolean {
  return !!(
    tagName &&
    tagName !== "null" &&
    tagName !== "undefined" &&
    tagName.trim()
  );
}

function getPercentage(count: number): string {
  if (totalCalls.value === 0) return "0";
  return ((Number(count) / totalCalls.value) * 100).toFixed(1);
}

function formatDateTime(dateString: string): string {
  if (!dateString) return "Не указано";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Неверная дата";
  }
}

function toggleSort(column: string) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortOrder.value = "asc";
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function setPeriod(days: number) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);

  filters.value.startDate = startDate.toISOString().split("T")[0] || "";
  filters.value.endDate = today.toISOString().split("T")[0] || "";

  loadStatistics();
}

async function loadStatistics() {
  loading.value = true;
  try {
    const params = new URLSearchParams();

    if (filters.value.startDate) {
      params.append("startDate", filters.value.startDate);
    }

    if (filters.value.endDate) {
      params.append("endDate", filters.value.endDate);
    }

    // Исключаем записи с тегом "no user"
    params.append("excludeTag", "no user");

    const response = await userApi(
      `/api/user/getCallStats?${params.toString()}`
    );

    if (response.status === "success") {
      console.log("Полученные данные:", response.data);
      console.log("timeSeriesData:", response.data.timeSeriesData);
      statisticsData.value = response.data;
      // Создаем график после загрузки данных
      nextTick(() => {
        updateChart();
      });
    } else {
      throw new Error(response.message || "Ошибка загрузки статистики");
    }
  } catch (error) {
    console.error("Ошибка при загрузке статистики:", error);
    const toast = useToast();
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить статистику",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

function exportTable() {
  try {
    // Простой экспорт в CSV
    const headers = ["ID", "Телефон", "Тег", "Дата обновления"];
    const rows = filteredCalls.value.map((call) => [
      call.id,
      call.phone,
      getTagName(call.tag),
      formatDateTime(call.status_updated_at),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `call_statistics_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    const toast = useToast();
    toast.add({
      title: "Успешно",
      description: "Таблица экспортирована",
      color: "success",
    });
  } catch (error) {
    console.error("Ошибка при экспорте:", error);
    const toast = useToast();
    toast.add({
      title: "Ошибка",
      description: "Не удалось экспортировать таблицу",
      color: "error",
    });
  }
}

// Загружаем статистику при монтировании с дефолтным периодом
onMounted(() => {
  // Устанавливаем дефолтные даты - последние 7 дней
  setPeriod(7);
});

// Следим за изменениями страницы для сброса пагинации при поиске
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* Стили для таблицы и пагинации */
.table-container {
  min-height: 400px;
}
</style>
