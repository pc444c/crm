<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок с быстрыми действиями -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-white">Управление командами</h1>
        <p class="text-gray-400 mt-1">
          Создавайте команды и управляйте доступом к базам данных
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        size="lg"
        @click="showCreateModal = true"
      >
        Создать команду
      </UButton>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="bg-gradient-to-r from-blue-600 to-blue-700">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-group" class="text-2xl text-white" />
          <div>
            <div class="text-2xl font-bold text-white">
              {{ statistics.totalTeams }}
            </div>
            <div class="text-blue-100 text-sm">Всего команд</div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-gradient-to-r from-green-600 to-green-700">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-users" class="text-2xl text-white" />
          <div>
            <div class="text-2xl font-bold text-white">
              {{ statistics.totalMembersInTeams }}
            </div>
            <div class="text-green-100 text-sm">Участников в командах</div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-gradient-to-r from-purple-600 to-purple-700">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-circle-stack" class="text-2xl text-white" />
          <div>
            <div class="text-2xl font-bold text-white">
              {{ statistics.totalDatabases }}
            </div>
            <div class="text-purple-100 text-sm">Всего баз данных</div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-gradient-to-r from-orange-600 to-orange-700">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-minus" class="text-2xl text-white" />
          <div>
            <div class="text-2xl font-bold text-white">
              {{ statistics.usersWithoutTeam }}
            </div>
            <div class="text-orange-100 text-sm">Без команды</div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Список команд -->
    <UCard>
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <h2 class="text-xl font-semibold">Команды</h2>
        <UInput
          v-model="searchQuery"
          placeholder="Поиск команд..."
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:w-64"
        />
      </div>

      <div v-if="isLoadingTeams" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="filteredTeams.length === 0" class="text-center py-12">
        <UIcon
          name="i-heroicons-user-group"
          class="text-6xl text-gray-400 mx-auto mb-4"
        />
        <p class="text-gray-400 text-lg">
          {{ teams.length === 0 ? "Команды не созданы" : "Команды не найдены" }}
        </p>
        <p class="text-gray-500 text-sm mt-2">
          {{
            teams.length === 0
              ? "Создайте первую команду для начала работы"
              : "Попробуйте изменить поисковый запрос"
          }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <UCard
          v-for="team in filteredTeams"
          :key="team.id"
          class="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary-500"
          @click="navigateToTeam(team.id)"
        >
          <div class="flex flex-col h-full">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-user-group"
                  class="text-primary-500 text-xl"
                />
                <h3 class="font-semibold text-lg truncate">{{ team.name }}</h3>
              </div>
              <UDropdown :items="getTeamActions(team)" class="flex-shrink-0">
                <UButton
                  icon="i-heroicons-ellipsis-vertical"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click.stop
                />
              </UDropdown>
            </div>

            <p
              v-if="team.description"
              class="text-gray-400 text-sm mb-4 line-clamp-2"
            >
              {{ team.description }}
            </p>

            <div class="mt-auto space-y-3">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-users" class="text-blue-400" />
                  <span class="text-gray-300"
                    >{{ team.memberCount }} участн.</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-circle-stack"
                    class="text-green-400"
                  />
                  <span class="text-gray-300"
                    >{{ team.databaseCount }} баз</span
                  >
                </div>
              </div>

              <div
                class="flex items-center justify-between pt-3 border-t border-gray-700"
              >
                <span class="text-xs text-gray-500"> ID: {{ team.id }} </span>
                <UBadge
                  :color="team.memberCount > 0 ? 'success' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  {{ team.memberCount > 0 ? "Активна" : "Пустая" }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>

    <!-- Модальное окно создания команды -->
    <UModal v-model:open="showCreateModal" title="Создание новой команды">
      <template #body>
        <form class="space-y-6" @submit.prevent="createTeam">
          <!-- Заголовок с иконкой -->
          <div
            class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-plus-circle"
                class="text-green-600 dark:text-green-400 text-xl"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Новая команда
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Создайте команду для совместной работы
              </p>
            </div>
          </div>

          <!-- Поля формы -->
          <div class="space-y-5">
            <UFormGroup label="Название команды" required>
              <UInput
                v-model="newTeam.name"
                placeholder="Введите название команды"
                icon="i-heroicons-user-group"
                size="lg"
                :disabled="isCreatingTeam"
                class="w-full"
              />
              <template #help>
                <span class="text-xs text-gray-500"
                  >Название должно быть понятным для всех участников</span
                >
              </template>
            </UFormGroup>

            <UFormGroup label="Описание команды">
              <UTextarea
                v-model="newTeam.description"
                placeholder="Опишите цели и задачи команды..."
                :rows="4"
                size="lg"
                :disabled="isCreatingTeam"
                class="w-full resize-none"
              />
              <template #help>
                <span class="text-xs text-gray-500"
                  >Помогите участникам понять назначение команды</span
                >
              </template>
            </UFormGroup>
          </div>

          <!-- Превью команды -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Превью команды:
            </h4>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UIcon
                  name="i-heroicons-user-group"
                  class="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h5 class="font-medium text-gray-900 dark:text-white">
                  {{ newTeam.name || "Название команды" }}
                </h5>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ newTeam.description || "Описание команды" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Кнопки -->
          <div
            class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              variant="outline"
              size="lg"
              :disabled="isCreatingTeam"
              @click="showCreateModal = false"
            >
              Отмена
            </UButton>
            <UButton
              color="primary"
              size="lg"
              :loading="isCreatingTeam"
              :disabled="!newTeam.name"
              icon="i-heroicons-plus"
              @click="createTeam"
            >
              Создать команду
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

interface Team {
  id: number;
  name: string;
  description?: string | null;
  created_at: string | Date;
  updated_at?: string;
  memberCount: number;
  databaseCount: number;
}

interface Statistics {
  totalTeams: number;
  totalDatabases: number;
  totalMembersInTeams: number;
  usersWithoutTeam: number;
}

const teams = ref<Team[]>([]);
const statistics = ref<Statistics>({
  totalTeams: 0,
  totalDatabases: 0,
  totalMembersInTeams: 0,
  usersWithoutTeam: 0,
});
const isLoadingTeams = ref(false);
const isCreatingTeam = ref(false);
const showCreateModal = ref(false);
const searchQuery = ref("");

const newTeam = ref({
  name: "",
  description: "",
});

// Вычисляемые свойства
const filteredTeams = computed(() => {
  if (!searchQuery.value) return teams.value;
  return teams.value.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Методы
const navigateToTeam = (teamId: number) => {
  navigateTo(`/admin/teams/${teamId}`);
};

const getTeamActions = (team: Team) => [
  [
    {
      label: "Управление",
      icon: "i-heroicons-cog-6-tooth",
      click: () => navigateToTeam(team.id),
    },
  ],
  [
    {
      label: "Удалить",
      icon: "i-heroicons-trash",
      click: () => deleteTeam(team.id),
    },
  ],
];

const deleteTeam = async (teamId: number) => {
  try {
    const response = await $fetch(`/api/admin/teams/${teamId}`, {
      method: "DELETE",
    });

    if (response && response.status === "success") {
      teams.value = teams.value.filter((team) => team.id !== teamId);
      toast.add({
        title: "Успешно",
        description: "Команда удалена",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Ошибка при удалении команды:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить команду",
      color: "error",
    });
  }
};

const loadTeams = async () => {
  isLoadingTeams.value = true;
  try {
    const response = await $fetch("/api/admin/teams/list");
    if (response && response.status === "success") {
      teams.value = response.teams || [];
      statistics.value = response.statistics || {
        totalTeams: 0,
        totalDatabases: 0,
        totalMembersInTeams: 0,
        usersWithoutTeam: 0,
      };
    }
  } catch (error) {
    console.error("Ошибка при загрузке команд:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить команды",
      color: "error",
    });
  } finally {
    isLoadingTeams.value = false;
  }
};

const createTeam = async () => {
  if (!newTeam.value.name.trim()) return;

  isCreatingTeam.value = true;
  try {
    const response = await $fetch("/api/admin/teams/create", {
      method: "POST",
      body: newTeam.value,
    });

    if (response && response.status === "success") {
      toast.add({
        title: "Успешно",
        description: "Команда создана",
        color: "success",
      });
      showCreateModal.value = false;
      newTeam.value = { name: "", description: "" };
      await loadTeams();
    }
  } catch (error) {
    console.error("Ошибка при создании команды:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось создать команду",
      color: "error",
    });
  } finally {
    isCreatingTeam.value = false;
  }
};

const _formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ru-RU");
};

// Загружаем команды при монтировании
onMounted(() => {
  loadTeams();
});

// Создание новой команды
// Переход на страницу детальной информации о команде

// Загрузка списка команд при монтировании компонента
onMounted(() => {
  loadTeams();
});
</script>
