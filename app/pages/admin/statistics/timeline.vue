<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Временная аналитика
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Анализ активности по времени и периодам
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" color="primary" @click="refresh">
        Обновить
      </UButton>
    </div>

    <!-- Фильтры периода -->
    <UCard>
      <div class="flex flex-wrap gap-4">
        <USelect
          v-model="selectedPeriod"
          :options="periodOptions"
          placeholder="Выберите период"
          class="w-48"
          @change="updateDateRange"
        />
        <DateFilter
          v-model:start-date="dateRange.start"
          v-model:end-date="dateRange.end"
          @update="fetchData"
        />
        <USelect
          v-model="groupBy"
          :options="groupByOptions"
          placeholder="Группировка"
          class="w-48"
        />
      </div>
    </UCard>

    <!-- Карточки со временными метриками -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Пиковая активность"
        :value="timeStats.peakHour"
        icon="i-heroicons-arrow-trending-up"
        color="blue"
        :loading="loading"
      />
      <MetricCard
        title="Среднее время сессии"
        :value="`${timeStats.averageSessionTime} мин`"
        icon="i-heroicons-clock"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Всего рабочих часов"
        :value="timeStats.totalWorkHours"
        icon="i-heroicons-calendar-days"
        color="purple"
        :loading="loading"
      />
      <MetricCard
        title="Эффективность"
        :value="`${timeStats.efficiency}%`"
        icon="i-heroicons-chart-pie"
        color="orange"
        :loading="loading"
      />
    </div>

    <!-- Основные временные графики -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Активность по часам -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Активность по часам дня</h3>
        </template>

        <BarChart
          v-if="hourlyData.length > 0"
          :data="hourlyData"
          :height="300"
          :categories="hourlyCategories"
          :y-axis="['activity']"
          :radius="4"
          :y-grid-line="true"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Почасовая статистика недоступна"
        />
      </UCard>

      <!-- Активность по дням недели -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Активность по дням недели</h3>
        </template>

        <BarChart
          v-if="weeklyData.length > 0"
          :data="weeklyData"
          :height="300"
          :categories="weeklyCategories"
          :y-axis="['calls', 'users']"
          :radius="4"
          :y-grid-line="true"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Недельная статистика недоступна"
        />
      </UCard>
    </div>

    <!-- Динамика активности -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Динамика активности</h3>
      </template>

      <LineChart
        v-if="timelineData.length > 0"
        :data="timelineData"
        :height="400"
        :categories="timelineCategories"
        :y-axis="['calls', 'users', 'session_time']"
      />
      <EmptyState
        v-else
        icon="i-heroicons-chart-bar"
        title="Нет данных"
        description="Временная динамика недоступна"
      />
    </UCard>

    <!-- Тепловая карта активности -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Тепловая карта активности</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Интенсивность активности по дням и часам
        </p>
      </template>

      <div v-if="heatmapData.length > 0" class="p-4">
        <!-- Заголовки часов -->
        <div class="grid grid-cols-25 gap-1 mb-2">
          <div class="text-xs text-center font-medium" />
          <div
            v-for="hour in 24"
            :key="hour"
            class="text-xs text-center font-medium"
          >
            {{ hour - 1 }}
          </div>
        </div>

        <!-- Данные по дням -->
        <div
          v-for="day in heatmapData"
          :key="day.name"
          class="grid grid-cols-25 gap-1 mb-1"
        >
          <div class="text-xs text-right font-medium pr-2 flex items-center">
            {{ day.name }}
          </div>
          <div
            v-for="(value, hour) in day.hours"
            :key="hour"
            class="w-4 h-4 rounded"
            :class="getHeatmapColor(value)"
            :title="`${day.name} ${hour}:00 - ${value} активностей`"
          />
        </div>

        <!-- Легенда -->
        <div class="flex items-center justify-center gap-2 mt-4 text-xs">
          <span>Меньше</span>
          <div class="flex gap-1">
            <div class="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
            <div class="w-3 h-3 bg-blue-100 dark:bg-blue-900 rounded" />
            <div class="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded" />
            <div class="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded" />
            <div class="w-3 h-3 bg-blue-700 dark:bg-blue-300 rounded" />
          </div>
          <span>Больше</span>
        </div>
      </div>

      <EmptyState
        v-else
        icon="i-heroicons-squares-2x2"
        title="Нет данных"
        description="Данные для тепловой карты недоступны"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface TimeStats {
  peakHour: string;
  averageSessionTime: number;
  totalWorkHours: number;
  efficiency: number;
}

interface HourlyPoint {
  hour: string;
  activity: number;
}

interface WeeklyPoint {
  day: string;
  calls: number;
  users: number;
}

interface TimelinePoint {
  date: string;
  calls: number;
  users: number;
  session_time: number;
}

interface HeatmapDay {
  name: string;
  hours: number[];
}

const loading = ref(false);
const selectedPeriod = ref("30d");
const groupBy = ref("day");

// Диапазон дат
const dateRange = ref({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date(),
});

// Данные временной аналитики
const { data: timeAnalyticsData, refresh: refreshTimeAnalytics } =
  await useFetch<{
    status: string;
    data: {
      stats: TimeStats;
      hourly: HourlyPoint[];
      weekly: WeeklyPoint[];
      timeline: TimelinePoint[];
      heatmap: HeatmapDay[];
    };
  }>("/api/admin/getTimeAnalytics", {
    query: computed(() => ({
      startDate: dateRange.value.start.toISOString(),
      endDate: dateRange.value.end.toISOString(),
      groupBy: groupBy.value,
    })),
  });

// Обработанные данные
const timeStats = computed(
  () =>
    timeAnalyticsData.value?.data?.stats || {
      peakHour: "00:00",
      averageSessionTime: 0,
      totalWorkHours: 0,
      efficiency: 0,
    }
);

const hourlyData = computed(() => timeAnalyticsData.value?.data?.hourly || []);
const weeklyData = computed(() => timeAnalyticsData.value?.data?.weekly || []);
const timelineData = computed(
  () => timeAnalyticsData.value?.data?.timeline || []
);
const heatmapData = computed(
  () => timeAnalyticsData.value?.data?.heatmap || []
);

const periodOptions = [
  { label: "Последние 7 дней", value: "7d" },
  { label: "Последние 30 дней", value: "30d" },
  { label: "Последние 90 дней", value: "90d" },
  { label: "Последний год", value: "1y" },
  { label: "Произвольный период", value: "custom" },
];

const groupByOptions = [
  { label: "По дням", value: "day" },
  { label: "По неделям", value: "week" },
  { label: "По месяцам", value: "month" },
];

const hourlyCategories = computed(() => ({
  activity: {
    name: "Активность",
    color: "#3b82f6",
  },
}));

const weeklyCategories = computed(() => ({
  calls: {
    name: "Звонки",
    color: "#8b5cf6",
  },
  users: {
    name: "Активные пользователи",
    color: "#10b981",
  },
}));

const timelineCategories = computed(() => ({
  calls: {
    name: "Звонки",
    color: "#3b82f6",
  },
  users: {
    name: "Пользователи",
    color: "#10b981",
  },
  session_time: {
    name: "Время сессий (мин)",
    color: "#f59e0b",
  },
}));

// Функции
const updateDateRange = () => {
  const now = new Date();
  switch (selectedPeriod.value) {
    case "7d":
      dateRange.value.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateRange.value.start = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      break;
    case "90d":
      dateRange.value.start = new Date(
        now.getTime() - 90 * 24 * 60 * 60 * 1000
      );
      break;
    case "1y":
      dateRange.value.start = new Date(
        now.getTime() - 365 * 24 * 60 * 60 * 1000
      );
      break;
  }
  dateRange.value.end = now;
  fetchData();
};

const getHeatmapColor = (value: number): string => {
  if (value === 0) return "bg-gray-100 dark:bg-gray-800";
  if (value <= 5) return "bg-blue-100 dark:bg-blue-900";
  if (value <= 15) return "bg-blue-300 dark:bg-blue-700";
  if (value <= 30) return "bg-blue-500 dark:bg-blue-500";
  return "bg-blue-700 dark:bg-blue-300";
};

const fetchData = () => {
  refreshTimeAnalytics();
};

const refresh = async () => {
  loading.value = true;
  try {
    await refreshTimeAnalytics();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.grid-cols-25 {
  grid-template-columns: repeat(25, minmax(0, 1fr));
}
</style>
