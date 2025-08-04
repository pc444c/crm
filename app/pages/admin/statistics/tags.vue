<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Статистика по тегам
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Анализ использования тегов в системе
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" color="primary" @click="refresh">
        Обновить
      </UButton>
    </div>

    <!-- Фильтры -->
    <UCard>
      <div class="flex flex-wrap gap-4">
        <USelect
          v-model="selectedTag"
          :options="tagOptions"
          placeholder="Выберите тег"
          class="w-64"
        />
        <DateFilter
          v-model:start-date="dateRange.start"
          v-model:end-date="dateRange.end"
          @update="fetchData"
        />
        <USelect
          v-model="selectedUser"
          :options="userOptions"
          placeholder="Выберите пользователя"
          class="w-64"
        />
      </div>
    </UCard>

    <!-- Общая статистика по тегам -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Всего тегов"
        :value="tagStats.totalTags"
        icon="i-heroicons-tag"
        color="blue"
        :loading="loading"
      />
      <MetricCard
        title="Активных тегов"
        :value="tagStats.activeTags"
        icon="i-heroicons-check-circle"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Применений тегов"
        :value="tagStats.totalApplications"
        icon="i-heroicons-cursor-arrow-rays"
        color="purple"
        :loading="loading"
      />
      <MetricCard
        title="Среднее применений на тег"
        :value="tagStats.averageApplications"
        icon="i-heroicons-chart-bar"
        color="orange"
        :loading="loading"
      />
    </div>

    <!-- Графики -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Топ тегов по использованию -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Топ-10 тегов по использованию</h3>
        </template>

        <BarChart
          v-if="topTagsData.length > 0"
          :data="topTagsData"
          :height="300"
          :categories="topTagsCategories"
          :y-axis="['count']"
          :radius="4"
          :y-grid-line="true"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Статистика по тегам недоступна"
        />
      </UCard>

      <!-- Динамика использования тегов -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Динамика использования тегов</h3>
        </template>

        <LineChart
          v-if="tagTimelineData.length > 0"
          :data="tagTimelineData"
          :height="300"
          :categories="timelineCategories"
          :y-axis="['applications']"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Временная статистика недоступна"
        />
      </UCard>
    </div>

    <!-- Статистика по выбранному тегу -->
    <div v-if="selectedTag" class="space-y-6">
      <USeparator label="Детальная статистика по тегу" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Всего применений"
          :value="selectedTagStats.totalApplications"
          icon="i-heroicons-cursor-arrow-rays"
          color="blue"
          :loading="loading"
        />
        <MetricCard
          title="Уникальных пользователей"
          :value="selectedTagStats.uniqueUsers"
          icon="i-heroicons-users"
          color="green"
          :loading="loading"
        />
        <MetricCard
          title="Применений за последнюю неделю"
          :value="selectedTagStats.weeklyApplications"
          icon="i-heroicons-calendar-days"
          color="purple"
          :loading="loading"
        />
      </div>

      <!-- Пользователи, использующие выбранный тег -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Пользователи, использующие тег</h3>
        </template>

        <DataTable
          :data="tagUsers"
          :columns="tagUsersColumns"
          :loading="loading"
          :page-size="10"
        />
      </UCard>
    </div>

    <!-- Таблица всех тегов -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Все теги</h3>
      </template>

      <DataTable
        :data="allTags"
        :columns="tagColumns"
        :loading="loading"
        :page-size="15"
        @row-click="selectTag"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Tag {
  id: number;
  name: string;
  color: string;
  applications_count: number;
  unique_users: number;
  last_used: string;
  created_at: string;
}

interface TagStats {
  totalTags: number;
  activeTags: number;
  totalApplications: number;
  averageApplications: number;
}

interface TagUser {
  user_id: number;
  user_name: string;
  applications_count: number;
  last_used: string;
}

interface TimelinePoint {
  date: string;
  applications: number;
}

const loading = ref(false);
const selectedTag = ref<number | null>(null);
const selectedUser = ref<number | null>(null);

// Диапазон дат
const dateRange = ref({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date(),
});

// Данные тегов
const { data: tagsData, refresh: refreshTags } = await useFetch<{
  status: string;
  data: {
    tags: Tag[];
    stats: TagStats;
    topTags: { name: string; count: number }[];
    timeline: TimelinePoint[];
  };
}>("/api/admin/getTagsStats", {
  query: computed(() => ({
    startDate: dateRange.value.start.toISOString(),
    endDate: dateRange.value.end.toISOString(),
    userId: selectedUser.value,
  })),
});

// Детальная статистика выбранного тега
const { data: selectedTagData, refresh: refreshSelectedTag } = await useFetch<{
  status: string;
  data: {
    stats: {
      totalApplications: number;
      uniqueUsers: number;
      weeklyApplications: number;
    };
    users: TagUser[];
  };
}>("/api/admin/getTagDetails", {
  query: computed(() => ({
    tagId: selectedTag.value,
    startDate: dateRange.value.start.toISOString(),
    endDate: dateRange.value.end.toISOString(),
  })),
  watch: [selectedTag, dateRange],
  server: false,
});

// Пользователи для фильтрации
const { data: usersData } = await useFetch<{
  status: string;
  data: { id: number; username: string }[];
}>("/api/admin/getUsersList");

// Обработанные данные
const allTags = computed(() => tagsData.value?.data?.tags || []);
const tagStats = computed(
  () =>
    tagsData.value?.data?.stats || {
      totalTags: 0,
      activeTags: 0,
      totalApplications: 0,
      averageApplications: 0,
    }
);

const topTagsData = computed(() => tagsData.value?.data?.topTags || []);
const tagTimelineData = computed(() => tagsData.value?.data?.timeline || []);

const selectedTagStats = computed(
  () =>
    selectedTagData.value?.data?.stats || {
      totalApplications: 0,
      uniqueUsers: 0,
      weeklyApplications: 0,
    }
);

const tagUsers = computed(() => selectedTagData.value?.data?.users || []);

const tagOptions = computed(() => [
  { label: "Все теги", value: null },
  ...allTags.value.map((tag) => ({
    label: tag.name,
    value: tag.id,
  })),
]);

const userOptions = computed(() => [
  { label: "Все пользователи", value: null },
  ...(usersData.value?.data || []).map((user) => ({
    label: user.username,
    value: user.id,
  })),
]);

const topTagsCategories = computed(() => ({
  count: {
    name: "Количество применений",
    color: "#8b5cf6",
  },
}));

const timelineCategories = computed(() => ({
  applications: {
    name: "Применения тегов",
    color: "#3b82f6",
  },
}));

const tagColumns = [
  {
    key: "name",
    label: "Название тега",
  },
  {
    key: "applications_count",
    label: "Применений",
    format: (value: number) => value.toLocaleString("ru-RU"),
  },
  {
    key: "unique_users",
    label: "Уникальных пользователей",
  },
  {
    key: "last_used",
    label: "Последнее использование",
    format: (value: string) =>
      value ? new Date(value).toLocaleString("ru-RU") : "Никогда",
  },
  {
    key: "created_at",
    label: "Создан",
    format: (value: string) => new Date(value).toLocaleString("ru-RU"),
  },
];

const tagUsersColumns = [
  {
    key: "user_name",
    label: "Пользователь",
  },
  {
    key: "applications_count",
    label: "Применений",
  },
  {
    key: "last_used",
    label: "Последнее использование",
    format: (value: string) => new Date(value).toLocaleString("ru-RU"),
  },
];

// Функции
const selectTag = (tag: Tag) => {
  selectedTag.value = tag.id;
};

const fetchData = () => {
  refreshTags();
  if (selectedTag.value) {
    refreshSelectedTag();
  }
};

const refresh = async () => {
  loading.value = true;
  try {
    await refreshTags();
    if (selectedTag.value) {
      await refreshSelectedTag();
    }
  } finally {
    loading.value = false;
  }
};
</script>
