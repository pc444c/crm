<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Статистика по пользователям
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Детальная аналитика активности пользователей
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
          v-model="selectedUser"
          :options="userOptions"
          placeholder="Выберите пользователя"
          class="w-64"
        />
        <DateFilter
          v-model:start-date="dateRange.start"
          v-model:end-date="dateRange.end"
          @update="fetchData"
        />
        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Статус пользователя"
          class="w-48"
        />
      </div>
    </UCard>

    <!-- Общая статистика -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Всего пользователей"
        :value="userStats.totalUsers"
        icon="i-heroicons-users"
        color="blue"
        :loading="loading"
      />
      <MetricCard
        title="Активных пользователей"
        :value="userStats.activeUsers"
        icon="i-heroicons-user-circle"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Онлайн сейчас"
        :value="userStats.onlineUsers"
        icon="i-heroicons-signal"
        color="green"
        :loading="loading"
      />
      <MetricCard
        title="Средняя сессия (мин)"
        :value="userStats.averageSessionTime"
        icon="i-heroicons-clock"
        color="orange"
        :loading="loading"
      />
    </div>

    <!-- Графики активности -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Активность пользователей -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Активность пользователей</h3>
        </template>

        <LineChart
          v-if="activityData.length > 0"
          :data="activityData"
          :height="300"
          :categories="activityCategories"
          :y-axis="['active_users', 'online_users']"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Данные об активности недоступны"
        />
      </UCard>

      <!-- Топ пользователей по звонкам -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Топ-10 пользователей по звонкам</h3>
        </template>

        <BarChart
          v-if="topUsersData.length > 0"
          :data="topUsersData"
          :height="300"
          :categories="topUsersCategories"
          :y-axis="['calls']"
          :radius="4"
          :y-grid-line="true"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Статистика по звонкам недоступна"
        />
      </UCard>
    </div>

    <!-- Детальная статистика выбранного пользователя -->
    <div v-if="selectedUser" class="space-y-6">
      <USeparator label="Детальная статистика пользователя" />

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Всего звонков"
          :value="selectedUserStats.totalCalls"
          icon="i-heroicons-phone"
          color="blue"
          :loading="loading"
        />
        <MetricCard
          title="Успешных звонков"
          :value="selectedUserStats.successfulCalls"
          icon="i-heroicons-check-circle"
          color="green"
          :loading="loading"
        />
        <MetricCard
          title="Время в системе (ч)"
          :value="selectedUserStats.totalTimeInSystem"
          icon="i-heroicons-clock"
          color="purple"
          :loading="loading"
        />
        <MetricCard
          title="Процент успеха"
          :value="`${selectedUserStats.successRate}%`"
          icon="i-heroicons-chart-pie"
          color="orange"
          :loading="loading"
        />
      </div>

      <!-- График активности выбранного пользователя -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">График активности пользователя</h3>
        </template>

        <LineChart
          v-if="userActivityData.length > 0"
          :data="userActivityData"
          :height="300"
          :categories="userActivityCategories"
          :y-axis="['calls', 'session_time']"
        />
        <EmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="Нет данных"
          description="Данные об активности пользователя недоступны"
        />
      </UCard>
    </div>

    <!-- Таблица всех пользователей -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Все пользователи</h3>
          <div class="flex items-center gap-2">
            <StatusBadge
              v-for="status in statusCounts"
              :key="status.status"
              :status="status.status"
              :count="status.count"
            />
          </div>
        </div>
      </template>

      <DataTable
        :data="filteredUsers"
        :columns="userColumns"
        :loading="loading"
        :page-size="15"
        @row-click="selectUser"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface User {
  id: number;
  username: string;
  status: "online" | "offline" | "busy";
  total_calls: number;
  successful_calls: number;
  success_rate: number;
  total_session_time: number;
  last_activity: string;
  created_at: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  averageSessionTime: number;
}

interface ActivityPoint {
  date: string;
  active_users: number;
  online_users: number;
}

interface UserActivityPoint {
  date: string;
  calls: number;
  session_time: number;
}

const loading = ref(false);
const selectedUser = ref<number | null>(null);
const statusFilter = ref<string | null>(null);

// Диапазон дат
const dateRange = ref({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date(),
});

// Данные пользователей
const { data: usersData, refresh: refreshUsers } = await useFetch<{
  status: string;
  data: {
    users: User[];
    stats: UserStats;
    activity: ActivityPoint[];
    topUsers: { username: string; calls: number }[];
    statusCounts: { status: string; count: number }[];
  };
}>("/api/admin/getUsersStats", {
  query: computed(() => ({
    startDate: dateRange.value.start.toISOString(),
    endDate: dateRange.value.end.toISOString(),
    status: statusFilter.value,
  })),
});

// Детальная статистика выбранного пользователя
const { data: selectedUserData, refresh: refreshSelectedUser } =
  await useFetch<{
    status: string;
    data: {
      stats: {
        totalCalls: number;
        successfulCalls: number;
        totalTimeInSystem: number;
        successRate: number;
      };
      activity: UserActivityPoint[];
    };
  }>("/api/admin/getUserDetails", {
    query: computed(() => ({
      userId: selectedUser.value,
      startDate: dateRange.value.start.toISOString(),
      endDate: dateRange.value.end.toISOString(),
    })),
    watch: [selectedUser, dateRange],
    server: false,
  });

// Обработанные данные
const allUsers = computed(() => usersData.value?.data?.users || []);
const userStats = computed(
  () =>
    usersData.value?.data?.stats || {
      totalUsers: 0,
      activeUsers: 0,
      onlineUsers: 0,
      averageSessionTime: 0,
    }
);

const activityData = computed(() => usersData.value?.data?.activity || []);
const topUsersData = computed(() => usersData.value?.data?.topUsers || []);
const statusCounts = computed(() => usersData.value?.data?.statusCounts || []);

const selectedUserStats = computed(
  () =>
    selectedUserData.value?.data?.stats || {
      totalCalls: 0,
      successfulCalls: 0,
      totalTimeInSystem: 0,
      successRate: 0,
    }
);

const userActivityData = computed(
  () => selectedUserData.value?.data?.activity || []
);

const filteredUsers = computed(() => {
  if (!statusFilter.value) return allUsers.value;
  return allUsers.value.filter((user) => user.status === statusFilter.value);
});

const userOptions = computed(() => [
  { label: "Все пользователи", value: null },
  ...allUsers.value.map((user) => ({
    label: user.username,
    value: user.id,
  })),
]);

const statusOptions = [
  { label: "Все статусы", value: null },
  { label: "Онлайн", value: "online" },
  { label: "Оффлайн", value: "offline" },
  { label: "Занят", value: "busy" },
];

const activityCategories = computed(() => ({
  active_users: {
    name: "Активные пользователи",
    color: "#3b82f6",
  },
  online_users: {
    name: "Онлайн пользователи",
    color: "#10b981",
  },
}));

const topUsersCategories = computed(() => ({
  calls: {
    name: "Количество звонков",
    color: "#8b5cf6",
  },
}));

const userActivityCategories = computed(() => ({
  calls: {
    name: "Звонки",
    color: "#3b82f6",
  },
  session_time: {
    name: "Время в системе (мин)",
    color: "#f59e0b",
  },
}));

const userColumns = [
  {
    key: "username",
    label: "Пользователь",
  },
  {
    key: "status",
    label: "Статус",
    component: "StatusBadge",
  },
  {
    key: "total_calls",
    label: "Всего звонков",
  },
  {
    key: "success_rate",
    label: "Успешность",
    format: (value: number) => `${value}%`,
  },
  {
    key: "total_session_time",
    label: "Время в системе (ч)",
    format: (value: number) => Math.round(value / 60),
  },
  {
    key: "last_activity",
    label: "Последняя активность",
    format: (value: string) => new Date(value).toLocaleString("ru-RU"),
  },
];

// Функции
const selectUser = (user: User) => {
  selectedUser.value = user.id;
};

const fetchData = () => {
  refreshUsers();
  if (selectedUser.value) {
    refreshSelectedUser();
  }
};

const refresh = async () => {
  loading.value = true;
  try {
    await refreshUsers();
    if (selectedUser.value) {
      await refreshSelectedUser();
    }
  } finally {
    loading.value = false;
  }
};
</script>
