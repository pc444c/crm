<template>
  <div class="p-4 w-full">
    <h1 class="text-2xl font-bold mb-6">
      Статистика звонков по установленным статусам
    </h1>

    <!-- Фильтр по дате (универсальный компонент) -->
    <DateFilter
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      title="Фильтр по дате установки статуса"
      @apply="applyFilter"
      @reset="resetFilter"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Статистика звонков по тегам (универсальный компонент) -->
      <DataCard
        title="Статистика по статусам"
        :loading="pending"
        :isEmpty="callStatsData.length === 0"
        :contentHeight="60"
      >
        <BarChart
          :data="tagChartData"
          :height="200"
          :categories="tagChartCategories"
          :y-axis="['count']"
          :x-num-ticks="5"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="(i: number) => tagChartData[i]?.tag || ''"
        />
      </DataCard>

      <!-- Статистика звонков по дням (универсальный компонент) -->
      <DataCard
        title="Активность по дням постановки статуса"
        :loading="pending"
        :isEmpty="timeSeriesData.length === 0"
        :contentHeight="60"
      >
        <LineChart
          :data="dayChartData"
          :height="200"
          :categories="dayChartCategories"
          :y-axis="['count']"
          :x-num-ticks="5"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="(i: number) => formatDate(dayChartData[i]?.date || '')"
        />
      </DataCard>
    </div>

    <!-- Таблица детальной статистики по тегам (универсальный компонент) -->
    <div class="mt-6">
      <DataCard
        title="Детальная статистика по тегам"
        :loading="false"
        :isEmpty="false"
        :contentHeight="0"
      >
        <DataTable
          :columns="[
            { key: 'status', label: 'Статус звонка' },
            { key: 'count', label: 'Количество' },
          ]"
          :items="callStatsData"
          :loading="pending"
        >
          <template #col-status="{ value }">
            <TagButton
              :text="value || 'Без статуса'"
              :color="getTagActualColor(value)"
              :tooltipText="getTagAbout(value)"
            />
          </template>
        </DataTable>
      </DataCard>
    </div>

    <!-- Список звонков пользователя (универсальный компонент) -->
    <div class="mt-6">
      <DataCard
        title="Список ваших звонков"
        :loading="false"
        :isEmpty="false"
        :contentHeight="0"
      >
        <DataTable
          :columns="[
            { key: 'fio', label: 'ФИО' },
            { key: 'phone', label: 'Телефон' },
            { key: 'city', label: 'Город' },
            { key: 'tag', label: 'Статус' },
            { key: 'status_updated_at', label: 'Дата обработки' },
          ]"
          :items="userCalls"
          :loading="pending"
        >
          <template #col-fio="{ value }">
            {{ value || "Не указано" }}
          </template>
          <template #col-phone="{ value }">
            {{ value || "Не указано" }}
          </template>
          <template #col-city="{ value }">
            {{ value || "Не указано" }}
          </template>
          <template #col-tag="{ value }">
            <TagButton
              :text="value || 'Без статуса'"
              :color="getTagActualColor(value)"
              :tooltipText="getTagAbout(value)"
            />
          </template>
          <template #col-status_updated_at="{ value }">
            {{ formatFullDate(value) }}
          </template>
        </DataTable>
      </DataCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

// Импортируем созданные универсальные компоненты
import DateFilter from "~/components/ui/DateFilter.vue";
import DataCard from "~/components/ui/DataCard.vue";
import DataTable from "~/components/ui/DataTable.vue";
import TagButton from "~/components/ui/TagButton.vue";

// Остальной код без изменений...

// Даты для фильтра - устанавливаем текущую дату по умолчанию
const today = new Date().toISOString().split("T")[0]; // Формат YYYY-MM-DD
const startDate = ref(today);
const endDate = ref(today);

// Загрузка данных с учетом фильтров
const {
  data: callStatsResponse,
  pending,
  refresh,
} = await useFetch<ApiResponse>("/api/user/getCallStats", {
  query: computed(() => ({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  })),
});

// Применение фильтра
function applyFilter() {
  refresh();
}

// Сброс фильтра
function resetFilter() {
  startDate.value = "";
  endDate.value = "";
  refresh();
}

// И все остальные функции и переменные из вашего текущего кода...
</script>
