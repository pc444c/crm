<template>
  <div class="p-4 w-full">
    <h1 class="text-2xl font-bold mb-6">
      Статистика звонков по установленным статусам
    </h1>

    <!-- Фильтр по дате (используем универсальный компонент) -->
    <DateFilter
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      title="Фильтр по дате установки статуса"
      @apply="applyFilter"
      @reset="resetFilter"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Статистика звонков по тегам (используем универсальный компонент) -->
      <DataCard
        title="Статистика по статусам"
        :loading="pending"
        :is-empty="callStatsData.length === 0"
        :content-height="300"
      >
        <BarChart
          :data="tagChartData"
          :height="300"
          :categories="tagChartCategories"
          :y-axis="['count']"
          :x-num-ticks="5"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="(i: number) => tagChartData[i]?.tag || ''"
        />
      </DataCard>

      <!-- Статистика звонков по дням (используем универсальный компонент) -->
      <DataCard
        title="Активность по дням постановки статуса"
        :loading="pending"
        :is-empty="timeSeriesData.length === 0"
        :content-height="300"
      >
        <LineChart
          :data="dayChartData"
          :height="300"
          :categories="dayChartCategories"
          :y-axis="['count']"
          :x-num-ticks="5"
          :radius="4"
          :y-grid-line="true"
          :x-formatter="(i: number) => formatDate(dayChartData[i]?.date || '')"
        />
      </DataCard>
    </div>

    <!-- Таблица детальной статистики по тегам (используем универсальные компоненты) -->
    <div class="mt-6">
      <DataCard
        title="Детальная статистика по тегам"
        :loading="false"
        :is-empty="false"
        :content-height="0"
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
              :tooltip-text="getTagAbout(value)"
            />
          </template>
        </DataTable>
      </DataCard>
    </div>

    <!-- Список звонков пользователя (используем универсальные компоненты) -->
    <div class="mt-6">
      <DataCard
        title="Список ваших звонков"
        :loading="false"
        :is-empty="false"
        :content-height="0"
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
              :tooltip-text="getTagAbout(value)"
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
import TagButton from "~/components/ui/TagButton.vue";
import DataCard from "~/components/ui/DataCard.vue";
import DateFilter from "~/components/ui/DateFilter.vue";
import DataTable from "~/components/ui/DataTable.vue";
import * as dateUtils from "~/utils/dates";
import * as tagUtils from "~/utils/tags";

// Определение типов данных
interface CallStat {
  status: string;
  count: number;
}

interface TimeSeriesStat {
  date: string;
  count: number;
}

interface ApiResponse {
  status: string;
  data?: {
    callStats: CallStat[];
    timeSeriesData: TimeSeriesStat[];
    userCalls: UserCall[];
    tags: Tag[];
  };
  message?: string;
  code?: number;
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
}

interface TagChartItem {
  tag: string;
  count: number;
  color: string; // Добавляем свойство color для хранения цвета тега
}

interface DayChartItem {
  date: string;
  count: number;
}

// Даты для фильтра - устанавливаем текущую дату по умолчанию
const today = dateUtils.getCurrentDate();
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

// Переиспользуем функции форматирования даты из утилит
const formatDate = dateUtils.formatDate;
const formatFullDate = dateUtils.formatFullDate;

// Данные для статистики по тегам
const callStatsData = computed<CallStat[]>(() => {
  if (
    !callStatsResponse.value ||
    callStatsResponse.value.status !== "success" ||
    !callStatsResponse.value.data
  ) {
    return [];
  }
  return callStatsResponse.value.data.callStats || [];
});

// Данные для статистики по дням
const timeSeriesData = computed<TimeSeriesStat[]>(() => {
  if (
    !callStatsResponse.value ||
    callStatsResponse.value.status !== "success" ||
    !callStatsResponse.value.data
  ) {
    return [];
  }
  return callStatsResponse.value.data.timeSeriesData || [];
});

// Данные о звонках пользователя
const userCalls = computed<UserCall[]>(() => {
  if (
    !callStatsResponse.value ||
    callStatsResponse.value.status !== "success" ||
    !callStatsResponse.value.data
  ) {
    return [];
  }

  const allCalls = callStatsResponse.value.data.userCalls || [];

  // Применяем фильтрацию по дате и к списку звонков
  if (startDate.value || endDate.value) {
    return allCalls.filter((call) => {
      if (!call.status_updated_at) return false;

      const callDate = new Date(call.status_updated_at);

      // Проверяем начальную дату
      if (startDate.value) {
        const startDateObj = new Date(startDate.value);
        startDateObj.setHours(0, 0, 0, 0);
        if (callDate < startDateObj) return false;
      }

      // Проверяем конечную дату
      if (endDate.value) {
        const endDateObj = new Date(endDate.value);
        endDateObj.setHours(23, 59, 59, 999);
        if (callDate > endDateObj) return false;
      }

      return true;
    });
  }

  return allCalls;
});

// Данные о доступных тегах
const tags = computed<Tag[]>(() => {
  if (
    !callStatsResponse.value ||
    callStatsResponse.value.status !== "success" ||
    !callStatsResponse.value.data
  ) {
    return [];
  }
  return callStatsResponse.value.data.tags || [];
});

// Получение цвета тега по имени (для обратной совместимости)
const _getTagColor = (
  tagName: string
):
  | "success"
  | "error"
  | "info"
  | "primary"
  | "secondary"
  | "warning"
  | "neutral" => {
  // Сначала ищем тег по точному совпадению имени
  const tag = tags.value.find((t) => t.name === tagName);
  if (tag) {
    // Преобразуем цвета из БД в допустимые цвета UBadge
    switch (tag.color.toLowerCase()) {
      case "red":
        return "error";
      case "green":
        return "success";
      case "blue":
        return "info";
      case "yellow":
        return "warning";
      case "purple":
        return "secondary";
      case "cyan":
        return "primary";
      default:
        return "neutral";
    }
  }

  // Преобразуем некоторые стандартные статусы в цвета
  switch (tagName?.toLowerCase()) {
    case "перезвон":
      return "warning";
    case "нищий":
      return "error";
    case "слив":
      return "error";
    case "мразь":
      return "error";
    case "ндз":
      return "info";
    case "пустой":
      return "secondary";
    case "передать":
      return "success";
    case "no used":
      return "neutral";
    default:
      return "neutral";
  }
};

// Адаптеры для работы с тегами, используют наши утилиты
const getTagActualColor = (tagName: string): string => {
  return tagUtils.getTagActualColor(tagName, tags.value);
};

// Адаптер для получения описания тега
const getTagAbout = (tagName: string): string => {
  return tagUtils.getTagAbout(tagName, tags.value);
};

// Подготовка данных для графика тегов
const tagChartData = computed<TagChartItem[]>(() => {
  return callStatsData.value.map((item: CallStat) => ({
    tag: item.status || "Без тега",
    count: item.count,
    // Добавляем цвет из тега или используем стандартный
    color: getTagActualColor(item.status),
  }));
});

// Категории для графика тегов с использованием цветов тегов
const tagChartCategories = computed(() => ({
  count: {
    name: "Количество звонков",
    // Делаем категорию цветной - цвет будет определяться для каждого элемента отдельно
    useColorFromData: true,
  },
}));

// Подготовка данных для графика активности по дням
const dayChartData = computed<DayChartItem[]>(() => {
  // Убедимся, что данные отсортированы по дате
  const sortedData = [...timeSeriesData.value].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return sortedData.map((item: TimeSeriesStat) => ({
    date: item.date,
    count: item.count,
  }));
});

// Категории для графика активности
const dayChartCategories = computed(() => ({
  count: {
    name: "Количество звонков",
    color: "#22c55e", // зеленый цвет
  },
}));

// Обновляем данные каждые 5 минут

// Автоматическое обновление данных каждые 5 минут
onMounted(() => {
  const intervalId = setInterval(() => {
    refresh();
  }, 300000); // 5 минут

  onBeforeUnmount(() => {
    clearInterval(intervalId);
  });
});
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
