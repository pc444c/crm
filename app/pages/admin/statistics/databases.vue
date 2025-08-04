<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          📊 Статистика баз данных
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Анализ и мониторинг всех баз данных системы
        </p>
      </div>
    </div>

    <!-- Основная информация о базах данных -->
    <UCard>
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-server-stack" class="text-blue-500" />
          <h3 class="text-lg font-semibold">Базы данных</h3>
        </div>
      </template>

      <div v-if="loadingDatabases" class="text-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 animate-spin mx-auto text-blue-500"
        />
        <p class="text-gray-500 mt-2">Загрузка баз данных...</p>
      </div>

      <div v-else-if="databases.length === 0" class="text-center py-8">
        <UIcon
          name="i-heroicons-server-stack"
          class="w-12 h-12 mx-auto text-gray-400"
        />
        <p class="text-gray-500 mt-2">Нет доступных баз данных</p>
      </div>

      <DataTable
        v-else
        :data="databases"
        :columns="databaseColumns"
        :loading="loadingDatabases"
        :page-size="15"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Интерфейсы
interface Database {
  id: number;
  name: string;
  created_at: string;
  records_count?: number;
}

// Реактивные переменные
const loadingDatabases = ref(false);

// Списки данных
const databases = ref<Database[]>([]);

// Колонки для таблиц
const databaseColumns = [
  {
    key: "name",
    label: "Название базы данных",
    sortable: true,
  },
  {
    key: "records_count",
    label: "Количество записей",
    sortable: true,
  },
  {
    key: "created_at",
    label: "Дата создания",
    sortable: true,
  },
];

// Функции
const fetchDatabases = async () => {
  loadingDatabases.value = true;
  try {
    const response = await $fetch("/api/admin/getDatabasesList");
    if (
      response &&
      typeof response === "object" &&
      "status" in response &&
      response.status === "success"
    ) {
      databases.value = (response as { data: Database[] }).data;
    }
  } catch (err: unknown) {
    console.error("Ошибка загрузки баз данных:", err);
    databases.value = [];
  } finally {
    loadingDatabases.value = false;
  }
};

// Инициализация
onMounted(() => {
  fetchDatabases();
});

// Мета-данные страницы
definePageMeta({
  layout: "admin",
});
</script>
