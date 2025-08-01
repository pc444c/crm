<template>
  <div class="min-w-full flex flex-col gap-4">
    <section class="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <USeparator
        color="primary"
        label="Статистика холодки"
        class="col-span-1 md:col-span-3 mb-4"
      />
      <admin-stat-user-all class="w-full" />
      <admin-stat-user-offline class="w-full" />
      <admin-stat-user-online class="w-full" />
    </section>
    <section class="mb-16">
      <USeparator
        color="primary"
        label="Статистика по звонкам"
        class="col-span-1 md:col-span-3 mb-4"
      />
      <div>
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          class="mb-4"
          label="Обновить статистику"
          @click="() => refresh()"
        />
        <BarChart
          v-if="RevenueData.length > 0"
          :key="colorMode.value"
          :data="RevenueData"
          :height="300"
          :categories="RevenueCategories"
          :y-axis="['desktop']"
          :x-num-ticks="6"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="xFormatter"
          :hide-legend="false"
        />
        <div v-else class="flex justify-center items-center h-80">
          <UIcon
            name="i-heroicons-information-circle"
            class="text-blue-500 mr-2"
          />
          <p>Нет данных для отображения</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();

// Определение типа для данных статистики
interface CallStat {
  status: string;
  count: number;
}

interface ApiResponse {
  status: string;
  data: CallStat[];
  message?: string;
}

const { data: callStatsResponse, refresh } = await useFetch<ApiResponse>(
  "/api/admin/getCallStats"
);

// Обработка данных для отображения на графике
const RevenueData = computed(() => {
  if (
    !callStatsResponse.value ||
    callStatsResponse.value.status !== "success"
  ) {
    return [];
  }

  // Преобразуем данные из API в формат для графика
  return callStatsResponse.value.data.map((item: CallStat) => ({
    month: item.status || "Без тега",
    desktop: item.count,
  }));
});

const RevenueCategories = computed(() => ({
  desktop: {
    name: "Количество звонков по статусу",
    color: "#22c55e",
  },
}));

const xFormatter = (i: number): string => {
  return RevenueData.value[i]?.month || "";
};

// Обновляем данные каждые 30 секунд
onMounted(() => {
  const intervalId = setInterval(() => {
    refresh();
  }, 30000);

  onBeforeUnmount(() => {
    clearInterval(intervalId);
  });
});
</script>

<style lang="scss" scoped></style>
