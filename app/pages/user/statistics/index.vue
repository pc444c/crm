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
      <!-- Статистика по тегам (круговая диаграмма) -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="text-primary" />
            <span class="font-semibold">Статистика по тегам</span>
          </div>
        </template>

        <div v-if="tagStats.length > 0" class="h-80">
          <ClientOnly>
            <EChart
              :option="pieChartOption"
              :autoresize="true"
              class="w-full h-full"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
              </div>
            </template>
          </ClientOnly>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-pie" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных по тегам</p>
        </div>
      </UCard>

      <!-- График по дням (линейная диаграмма) -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-primary" />
            <span class="font-semibold">Динамика по дням</span>
          </div>
        </template>

        <div v-if="timeSeriesData.length > 0" class="h-80">
          <ClientOnly>
            <EChart
              :option="lineChartOption"
              :autoresize="true"
              class="w-full h-full"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
              </div>
            </template>
          </ClientOnly>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных для графика</p>
        </div>
      </UCard>
    </div>

    <!-- Детальная статистика в виде таблиц -->
    <div
      v-if="loading || totalCalls > 0 || filters.startDate || filters.endDate"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <!-- Таблица статистики по тегам -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-table-cells" class="text-primary" />
            <span class="font-semibold">Детальная статистика по тегам</span>
          </div>
        </template>

        <div v-if="tagStats.length > 0" class="space-y-3">
          <div
            v-for="stat in tagStats"
            :key="stat.status"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded-full shadow-sm"
                :style="{ backgroundColor: getTagColor(stat.status) }"
              />
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {{ getTagName(stat.status) }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
                {{ stat.count }}
              </span>
              <span
                class="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full"
              >
                {{ getPercentage(stat.count) }}%
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-pie" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных по тегам</p>
        </div>
      </UCard>

      <!-- Таблица динамики по дням -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar-days" class="text-primary" />
            <span class="font-semibold">Детальная динамика по дням</span>
          </div>
        </template>

        <div
          v-if="timeSeriesData.length > 0"
          class="space-y-2 max-h-80 overflow-y-auto"
        >
          <div
            v-for="(data, index) in timeSeriesData"
            :key="data.date"
            class="flex items-center justify-between p-3 rounded-lg"
            :class="
              index % 2 === 0
                ? 'bg-gray-50 dark:bg-gray-800'
                : 'bg-white dark:bg-gray-900'
            "
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-calendar"
                class="text-blue-500 flex-shrink-0"
              />
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatDate(data.date) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-blue-600 dark:text-blue-400">
                {{ data.count }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                звонков
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных для отображения</p>
        </div>
      </UCard>
    </div>

    <!-- Таблица звонков -->
    <DataTable
      ref="tableCard"
      :items="userCalls"
      :columns="callsColumns"
      :loading="loading"
      title="История звонков"
      header-icon="i-heroicons-table-cells"
      search-key="phone"
      search-placeholder="Поиск по телефону..."
      :page-size="20"
      empty-message="Записи не найдены"
      show-export
      @export="exportTable"
      @page-change="scrollToTable"
    >
      <template #cell-tag="{ item }">
        <div v-if="hasValidTag(String(item.tag))" class="inline-block">
          <TagButton
            :text="getTagName(String(item.tag))"
            :color="getTagColor(String(item.tag))"
            :tooltip-text="getTagName(String(item.tag))"
            class="text-xs"
          />
        </div>
        <span v-else class="text-gray-400 text-sm">Без тега</span>
      </template>

      <template #cell-status_updated_at="{ value }">
        {{ formatDateTime(String(value)) }}
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { userApi } from "@/utils/api";
import TagButton from "@/components/ui/TagButton.vue";
import DataTable from "@/components/ui/DataTable.vue";
import EChart from "@/components/chart/EChart.vue";

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
const tableCard = ref();

// Конфигурация колонок для таблицы
const callsColumns = [
  {
    key: "id",
    label: "ID",
    sortable: true,
    class: "font-medium text-gray-900 dark:text-gray-100",
  },
  {
    key: "phone",
    label: "Телефон",
    sortable: true,
    class: "text-gray-900 dark:text-gray-100 font-mono",
  },
  {
    key: "tag",
    label: "Тег",
    sortable: true,
  },
  {
    key: "status_updated_at",
    label: "Дата обновления",
    sortable: true,
    class: "text-gray-900 dark:text-gray-100",
  },
];

// Плавная прокрутка к таблице при смене страницы
function scrollToTable() {
  nextTick(() => {
    if (tableCard.value?.$el) {
      tableCard.value.$el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
}

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
    (stat) => stat.status !== "no user" && stat.status !== "no used" && stat.status !== "used"
  );
});
const timeSeriesData = computed(
  () => statisticsData.value.timeSeriesData || []
);
const userCalls = computed(() => {
  const calls = statisticsData.value.userCalls || [];
  return calls.filter(
    (call) => call.tag !== "no user" && call.tag !== "no used" && call.tag !== "used"
  );
});
const availableTags = computed(() => statisticsData.value.tags || []);

// Вспомогательные функции
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

function getPercentage(count: number): string {
  if (totalCalls.value === 0) return "0";
  return ((Number(count) / totalCalls.value) * 100).toFixed(1);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
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

function hasValidTag(tagName: string): boolean {
  return !!(
    tagName &&
    tagName !== "null" &&
    tagName !== "undefined" &&
    tagName.trim()
  );
}

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

// Опции для круговой диаграммы (статистика по тегам)
const pieChartOption = computed(() => {
  // Безопасная проверка для SSR
  const isDark = typeof document !== 'undefined' 
    ? document?.documentElement?.classList?.contains("dark") ?? false
    : false;

  const data = tagStats.value.map((stat) => ({
    name: getTagName(stat.status),
    value: Number(stat.count),
    itemStyle: {
      color: getTagColor(stat.status),
    },
  }));

  return {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
      backgroundColor: isDark
        ? "rgba(31, 41, 55, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      borderColor: isDark
        ? "rgba(75, 85, 99, 0.5)"
        : "rgba(229, 231, 235, 0.5)",
      textStyle: {
        color: isDark ? "#f3f4f6" : "#374151",
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
      textStyle: {
        color: isDark ? "#d1d5db" : "#374151",
      },
    },
    series: [
      {
        name: "Звонки",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? "#1f2937" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: "bold",
            color: isDark ? "#f3f4f6" : "#374151",
          },
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
  };
});

// Опции для линейной диаграммы (динамика по дням)
const lineChartOption = computed(() => {
  // Безопасная проверка для SSR
  const isDark = typeof document !== 'undefined' 
    ? document?.documentElement?.classList?.contains("dark") ?? false
    : false;

  const dates = timeSeriesData.value.map((item) => {
    const date = new Date(item.date);
    return date.toLocaleDateString("ru-RU", {
      month: "short",
      day: "numeric",
    });
  });

  const values = timeSeriesData.value.map((item) => Number(item.count));

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark
        ? "rgba(31, 41, 55, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      borderColor: isDark
        ? "rgba(75, 85, 99, 0.5)"
        : "rgba(229, 231, 235, 0.5)",
      textStyle: {
        color: isDark ? "#f3f4f6" : "#374151",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: isDark ? "#6b7280" : "#d1d5db",
        },
      },
      axisLabel: {
        color: isDark ? "#d1d5db" : "#6b7280",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: isDark ? "#6b7280" : "#d1d5db",
        },
      },
      axisLabel: {
        color: isDark ? "#d1d5db" : "#6b7280",
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "#374151" : "#f3f4f6",
        },
      },
    },
    series: [
      {
        name: "Звонки",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          color: "#22c55e",
          width: 3,
        },
        itemStyle: {
          color: "#22c55e",
          borderColor: isDark ? "#1f2937" : "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(34, 197, 94, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(34, 197, 94, 0.1)",
              },
            ],
          },
        },
        data: values,
      },
    ],
  };
});

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

    // Исключаем записи с системными тегами (API сам обработает базовые исключения)
    // Дополнительные исключения можно добавить при необходимости

    const response = await userApi(
      `/api/user/getCallStats?${params.toString()}`
    );

    if (response.status === "success") {
      console.log("Полученные данные:", response.data);
      console.log("timeSeriesData:", response.data.timeSeriesData);
      statisticsData.value = response.data;
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
    const rows = userCalls.value.map((call) => [
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
</script>

<style scoped>
/* Стили для таблицы и пагинации */
.table-container {
  min-height: 400px;
}
</style>
