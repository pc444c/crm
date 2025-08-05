<template>
  <div class="min-w-full flex flex-col gap-6">
    <!-- Заголовок и поиск -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Базы данных
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Управление загруженными базами данных
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          placeholder="Поиск по названию..."
          class="w-full sm:w-64"
          icon="i-lucide-search"
        />
        <UButton
          to="/admin/databases"
          color="primary"
          icon="i-lucide-plus"
          class="justify-center sm:justify-start"
        >
          Загрузить новую
        </UButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard
        class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2 bg-blue-500 rounded-lg flex items-center justify-center"
          >
            <Icon name="i-lucide-database" class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm text-blue-600 dark:text-blue-400">Всего баз</p>
            <p class="text-xl font-bold text-blue-800 dark:text-blue-200">
              {{ databases.length }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard
        class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2 bg-green-500 rounded-lg flex items-center justify-center"
          >
            <Icon name="i-lucide-users" class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm text-green-600 dark:text-green-400">
              Всего записей
            </p>
            <p class="text-xl font-bold text-green-800 dark:text-green-200">
              {{ totalRecords }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard
        class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2 bg-purple-500 rounded-lg flex items-center justify-center"
          >
            <Icon name="i-lucide-calendar" class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm text-purple-600 dark:text-purple-400">
              Последняя загрузка
            </p>
            <p class="text-xs font-medium text-purple-800 dark:text-purple-200">
              {{ lastUploadDate }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Список баз данных -->
    <UCard v-if="paginatedData.length > 0">
      <div class="grid gap-4">
        <div
          v-for="database in paginatedData"
          :key="database.id"
          class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center"
                >
                  <Icon
                    name="i-lucide-database"
                    class="w-4 h-4 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    {{ database.name }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    ID: {{ database.id }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-4 text-sm">
                <div
                  class="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                >
                  <Icon name="i-lucide-users" class="w-4 h-4" />
                  <span
                    >{{ database.recordsCount.toLocaleString() }} записей</span
                  >
                </div>
                <div
                  class="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                >
                  <Icon name="i-lucide-calendar" class="w-4 h-4" />
                  <span>{{ formatDate(database.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash-2"
                class="hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="confirmDelete(database)"
              >
                Удалить
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Показано
          {{ Math.min((page - 1) * pageSize + 1, filteredData.length) }}-{{
            Math.min(page * pageSize, filteredData.length)
          }}
          из {{ filteredData.length }}
        </p>
        <div class="flex items-center gap-2">
          <UButton
            :disabled="page === 1"
            size="sm"
            variant="outline"
            icon="i-lucide-chevron-left"
            @click="page--"
          >
            Назад
          </UButton>
          <div class="flex items-center gap-1">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ page }} из {{ totalPages }}
            </span>
          </div>
          <UButton
            :disabled="page === totalPages"
            size="sm"
            variant="outline"
            icon="i-lucide-chevron-right"
            @click="page++"
          >
            Вперёд
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Пустое состояние -->
    <UCard v-else class="text-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div
          class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
        >
          <Icon name="i-lucide-database" class="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет баз данных
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{
              search
                ? "По вашему запросу ничего не найдено"
                : "Загрузите первую базу данных для начала работы"
            }}
          </p>
          <UButton
            v-if="!search"
            to="/admin/databases"
            color="primary"
            icon="i-lucide-plus"
          >
            Загрузить базу данных
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Модальное окно подтверждения удаления -->
    <UModal v-model:open="isDeleteModalOpen" title="Подтверждение удаления">
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center"
          >
            <Icon
              name="i-lucide-alert-triangle"
              class="w-5 h-5 text-red-600 dark:text-red-400"
            />
          </div>
          <h3 class="text-lg font-semibold">Подтверждение удаления</h3>
        </div>
      </template>

      <template #body>
        <div class="py-4">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Вы действительно хотите удалить базу данных
            <strong class="text-gray-900 dark:text-white">{{
              selectedDatabase?.name
            }}</strong
            >?
          </p>
          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
          >
            <div class="flex items-start gap-2">
              <Icon
                name="i-lucide-alert-triangle"
                class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5"
              />
              <div class="text-sm">
                <p class="font-medium text-yellow-800 dark:text-yellow-200">
                  Внимание!
                </p>
                <p class="text-yellow-700 dark:text-yellow-300">
                  Это действие нельзя отменить. Все записи ({{
                    selectedDatabase?.recordsCount
                  }}) будут удалены навсегда.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <UButton
            color="neutral"
            variant="soft"
            @click="isDeleteModalOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isDeleting"
            @click="deleteDatabase"
          >
            Удалить
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
const search = ref("");
const page = ref(1);
const pageSize = 8;
const isDeleteModalOpen = ref(false);
const selectedDatabase = ref<Database | null>(null);
const isDeleting = ref(false);

interface Database {
  id: number;
  name: string;
  created_at: string;
  recordsCount: number;
}

const toast = useToast();
const databases = ref<Database[]>([]);

// Вычисляемые свойства для статистики
const totalRecords = computed(() =>
  databases.value.reduce((sum, db) => sum + db.recordsCount, 0)
);

const lastUploadDate = computed(() => {
  if (databases.value.length === 0) return "Нет данных";
  const latest = databases.value.reduce((latest, db) =>
    new Date(db.created_at) > new Date(latest.created_at) ? db : latest
  );
  return formatDate(latest.created_at);
});

const filteredData = computed(() =>
  databases.value.filter((row) =>
    row.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize))
);

const paginatedData = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredData.value.slice(start, start + pageSize);
});

watch([search, filteredData], () => {
  page.value = 1;
});

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confirmDelete(database: Database) {
  selectedDatabase.value = database;
  isDeleteModalOpen.value = true;
}

async function deleteDatabase() {
  if (!selectedDatabase.value) return;

  isDeleting.value = true;
  try {
    const res = await $fetch(`/api/deletedb`, {
      method: "POST",
      body: { dbId: selectedDatabase.value.id },
    });

    await LoadDBInfo();

    if (res) {
      toast.add({
        title: "База данных удалена",
        description: `База "${selectedDatabase.value.name}" успешно удалена`,
        color: "success",
      });
    }
  } catch (error) {
    console.error("Ошибка при удалении базы данных:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить базу данных",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
    selectedDatabase.value = null;
  }
}

async function LoadDBInfo() {
  try {
    const response = (await $fetch("/api/basesinfo")) as any;
    console.log("Данные успешно загружены:", response);
    if (response.databases) {
      databases.value.splice(0, databases.value.length, ...response.databases);
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить список баз данных",
      color: "error",
    });
  }
}

onMounted(() => {
  LoadDBInfo();
});
</script>

<style lang="scss" scoped></style>
