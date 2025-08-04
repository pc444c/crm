<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Общая статистика
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Обзор основных метрик системы
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" color="primary" @click="refresh">
        Обновить
      </UButton>
    </div>

    <!-- Карточки с основными метриками -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Всего пользователей"
        :value="stats.totalUsers"
        icon="i-heroicons-users"
        color="blue"
        :loading="loading"
      />
      <MetricCard
        title="Активных пользователей"
        :value="stats.activeUsers"
        icon="i-heroicons-user-circle"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Всего баз данных"
        :value="stats.totalDatabases"
        icon="i-heroicons-circle-stack"
        color="purple"
        :loading="loading"
      />
      <MetricCard
        title="Всего записей"
        :value="stats.totalRecords"
        icon="i-heroicons-document-text"
        color="orange"
        :loading="loading"
      />
    </div>

    <!-- Графики -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Статистика по звонкам -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Статистика по звонкам</h3>
        </template>

        <div v-if="callsData.length > 0">
          <BarChart
            :data="callsData"
            :height="300"
            :categories="callsCategories"
            :y-axis="['calls']"
            :radius="4"
            :y-grid-line="true"
          />
        </div>
        <div v-else class="flex justify-center items-center h-80">
          <div class="text-center">
            <UIcon
              name="i-heroicons-chart-bar"
              class="text-gray-400 text-4xl mb-2"
            />
            <p class="text-gray-500">Нет данных для отображения</p>
          </div>
        </div>
      </UCard>

      <!-- Статистика по статусам -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Распределение по статусам</h3>
        </template>

        <div v-if="statusData.length > 0">
          <PieChart :data="statusData" :height="300" />
        </div>
        <div v-else class="flex justify-center items-center h-80">
          <div class="text-center">
            <UIcon
              name="i-heroicons-chart-pie"
              class="text-gray-400 text-4xl mb-2"
            />
            <p class="text-gray-500">Нет данных для отображения</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Таблица последних активностей -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Последние активности</h3>
      </template>

      <DataTable
        :data="recentActivities"
        :columns="activityColumns"
        :loading="loading"
        :page-size="10"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalDatabases: number;
  totalRecords: number;
}

interface CallStat {
  status: string;
  count: number;
}

interface Activity {
  id: number;
  user_name: string;
  action: string;
  timestamp: string;
  details: string;
}

const loading = ref(false);

// Данные статистики
const { data: statsData, refresh: refreshStats } = await useFetch<{
  status: string;
  data: OverviewStats;
}>("/api/admin/getOverviewStats");

const { data: callsStatsData, refresh: refreshCalls } = await useFetch<{
  status: string;
  data: CallStat[];
}>("/api/admin/getCallStats");

const { data: activitiesData, refresh: refreshActivities } = await useFetch<{
  status: string;
  data: Activity[];
}>("/api/admin/getRecentActivities");

// Обработанные данные
const stats = computed(
  () =>
    statsData.value?.data || {
      totalUsers: 0,
      activeUsers: 0,
      totalDatabases: 0,
      totalRecords: 0,
    }
);

const callsData = computed(() => {
  if (!callsStatsData.value?.data) return [];

  return callsStatsData.value.data.map((item: CallStat) => ({
    status: item.status || "Без статуса",
    calls: item.count,
  }));
});

const statusData = computed(() => {
  if (!callsStatsData.value?.data) return [];

  return callsStatsData.value.data.map((item: CallStat) => ({
    name: item.status || "Без статуса",
    value: item.count,
  }));
});

const recentActivities = computed(() => activitiesData.value?.data || []);

const callsCategories = computed(() => ({
  calls: {
    name: "Количество звонков",
    color: "#3b82f6",
  },
}));

const activityColumns = [
  {
    key: "user_name",
    label: "Пользователь",
  },
  {
    key: "action",
    label: "Действие",
  },
  {
    key: "details",
    label: "Детали",
  },
  {
    key: "timestamp",
    label: "Время",
    format: (value: string) => new Date(value).toLocaleString("ru-RU"),
  },
];

// Функция обновления всех данных
const refresh = async () => {
  loading.value = true;
  try {
    await Promise.all([refreshStats(), refreshCalls(), refreshActivities()]);
  } finally {
    loading.value = false;
  }
};
</script>
