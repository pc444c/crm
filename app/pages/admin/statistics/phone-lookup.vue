<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          📞 Статистика проверки номеров
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Анализ запросов по проверке телефонных номеров
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" color="primary" @click="refresh">
        Обновить
      </UButton>
    </div>

    <!-- Основная статистика -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Всего запросов"
        :value="stats.totalLookups"
        icon="i-heroicons-phone"
        color="blue"
        :loading="loading"
      />
      <MetricCard
        title="Запросов сегодня"
        :value="stats.lookupsToday"
        icon="i-heroicons-calendar-days"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Ошибки"
        :value="stats.totalErrors"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        :loading="loading"
      />
    </div>

    <!-- Графики -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Операторы связи -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-signal" class="text-blue-500" />
            <h3 class="text-lg font-semibold">Топ операторов связи</h3>
          </div>
        </template>

        <div v-if="stats.operators && stats.operators.length > 0" class="h-80">
          <ClientOnly>
            <EChart
              :option="operatorsChartOption"
              :autoresize="true"
              class="w-full h-full"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin text-4xl text-primary"
                />
              </div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-pie" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных для отображения</p>
        </div>
      </UCard>

      <!-- Регионы -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-map" class="text-green-500" />
            <h3 class="text-lg font-semibold">Топ регионов</h3>
          </div>
        </template>

        <div v-if="stats.regions && stats.regions.length > 0" class="h-80">
          <ClientOnly>
            <EChart
              :option="regionsChartOption"
              :autoresize="true"
              class="w-full h-full"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin text-4xl text-primary"
                />
              </div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 mb-4" />
          <p>Нет данных для отображения</p>
        </div>
      </UCard>
    </div>

    <!-- Таблица типов ошибок -->
    <UCard v-if="stats.errorTypes && stats.errorTypes.length > 0">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500" />
          <h3 class="text-lg font-semibold">Типы ошибок</h3>
        </div>
      </template>

      <DataTable
        :data="stats.errorTypes"
        :columns="errorColumns"
        :loading="loading"
        :page-size="10"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Типы данных
interface PhoneLookupStats {
  totalLookups: number;
  lookupsToday: number;
  lookupsThisWeek: number;
  totalErrors: number;
  operators: Array<{ name: string; count: number }>;
  regions: Array<{ name: string; count: number }>;
  errorTypes: Array<{ type: string; count: number }>;
}

// Состояние
const loading = ref(false);
const stats = ref<PhoneLookupStats>({
  totalLookups: 0,
  lookupsToday: 0,
  lookupsThisWeek: 0,
  totalErrors: 0,
  operators: [],
  regions: [],
  errorTypes: [],
});

// Колонки для таблицы ошибок
const errorColumns = [
  {
    key: "type",
    label: "Тип ошибки",
  },
  {
    key: "count",
    label: "Количество",
  },
];

// Настройки для графиков ECharts
const operatorsChartOption = computed(() => ({
  tooltip: {
    trigger: "item",
  },
  legend: {
    orient: "horizontal",
    bottom: "0",
  },
  series: [
    {
      name: "Операторы",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
        position: "center",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: "18",
          fontWeight: "bold",
        },
      },
      labelLine: {
        show: false,
      },
      data: stats.value.operators.map((item) => ({
        name: item.name || "Неизвестный оператор",
        value: item.count,
      })),
    },
  ],
}));

const regionsChartOption = computed(() => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "value",
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    type: "category",
    data: stats.value.regions.map((item) => item.name || "Неизвестный регион"),
    inverse: true,
  },
  series: [
    {
      name: "Количество",
      type: "bar",
      data: stats.value.regions.map((item) => item.count),
    },
  ],
}));

// Загрузка данных
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/admin/getPhoneLookupStats");
    if (
      response &&
      typeof response === "object" &&
      "status" in response &&
      response.status === "success"
    ) {
      stats.value = (response as { data: PhoneLookupStats }).data;
    }
  } catch (error) {
    console.error("Ошибка загрузки статистики проверки номеров:", error);
  } finally {
    loading.value = false;
  }
};

// Обновление данных
const refresh = () => {
  fetchData();
};

// Загрузка при монтировании
onMounted(() => {
  fetchData();
});

// Мета-данные страницы
definePageMeta({
  layout: "admin",
});
</script>
