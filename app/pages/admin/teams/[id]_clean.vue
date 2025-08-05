<template>
  <div class="flex flex-col gap-6">
    <!-- Хедер -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ teamName }}</h1>
          <p class="text-gray-400 mt-1">Управление участниками и доступами</p>
        </div>
        <div class="flex gap-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="outline"
            @click="$router.back()"
          >
            Назад
          </UButton>
          <UButton
            icon="i-heroicons-arrow-path"
            variant="outline"
            :loading="isLoading"
            @click="refreshAll"
          >
            Обновить
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500/20 rounded-lg">
            <UIcon name="i-heroicons-users" class="text-blue-400 text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ members.length }}</p>
            <p class="text-gray-400 text-sm">Участников</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-500/20 rounded-lg">
            <UIcon
              name="i-heroicons-circle-stack"
              class="text-green-400 text-xl"
            />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">
              {{ accessibleDatabasesCount }}
            </p>
            <p class="text-gray-400 text-sm">Доступных баз</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-500/20 rounded-lg">
            <UIcon
              name="i-heroicons-user-plus"
              class="text-purple-400 text-xl"
            />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">
              {{ availableUsers.length }}
            </p>
            <p class="text-gray-400 text-sm">Доступно для добавления</p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Участники команды -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-users" class="text-blue-400" />
              <h3 class="text-lg font-semibold">Участники команды</h3>
            </div>
            <UBadge :color="members.length > 0 ? 'success' : 'neutral'">
              {{ members.length }} участников
            </UBadge>
          </div>
        </template>

        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-4xl text-blue-400"
          />
        </div>

        <UEmptyState
          v-else-if="members.length === 0"
          icon="i-heroicons-users"
          title="Нет участников"
          description="В команде пока нет участников"
        />

        <div v-else class="space-y-3">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <UIcon name="i-heroicons-user" class="text-white text-sm" />
              </div>
              <div>
                <p class="font-medium text-white">{{ member.login }}</p>
                <p class="text-sm text-gray-400">{{ member.role }}</p>
              </div>
            </div>
            <UButton
              icon="i-heroicons-trash"
              size="sm"
              color="red"
              variant="ghost"
              :loading="removingMemberId === member.id"
              @click="removeMember(member.id)"
            />
          </div>
        </div>
      </UCard>

      <!-- Добавление пользователей -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-plus" class="text-purple-400" />
            <h3 class="text-lg font-semibold">Добавить пользователей</h3>
          </div>
        </template>

        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-4xl text-purple-400"
          />
        </div>

        <UEmptyState
          v-else-if="availableUsers.length === 0"
          icon="i-heroicons-user-plus"
          title="Нет доступных пользователей"
          description="Все пользователи уже добавлены в команды"
        />

        <div v-else class="space-y-3">
          <div
            v-for="user in availableUsers"
            :key="user.id"
            class="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"
              >
                <UIcon name="i-heroicons-user" class="text-white text-sm" />
              </div>
              <div>
                <p class="font-medium text-white">{{ user.login }}</p>
                <p class="text-sm text-gray-400">{{ user.role }}</p>
              </div>
            </div>
            <UButton
              icon="i-heroicons-plus"
              size="sm"
              color="purple"
              :loading="addingUserId === user.id"
              @click="addMember(user.id)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Управление базами данных -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-circle-stack" class="text-green-400" />
            <h3 class="text-lg font-semibold">Доступ к базам данных</h3>
          </div>
          <UBadge :color="accessibleDatabasesCount > 0 ? 'success' : 'neutral'">
            {{ accessibleDatabasesCount }} из {{ databases.length }}
          </UBadge>
        </div>
      </template>

      <div v-if="isLoading" class="flex justify-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-4xl text-green-400"
        />
      </div>

      <UEmptyState
        v-else-if="databases.length === 0"
        icon="i-heroicons-circle-stack"
        title="Нет баз данных"
        description="В системе пока нет баз данных"
      />

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="database in databases"
          :key="database.id"
          class="p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          :class="{
            'bg-green-500/10 border-green-500/30': database.hasAccess,
            'bg-gray-800': !database.hasAccess,
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="{
                  'bg-green-500/20': database.hasAccess,
                  'bg-gray-700': !database.hasAccess,
                }"
              >
                <UIcon
                  name="i-heroicons-circle-stack"
                  :class="{
                    'text-green-400': database.hasAccess,
                    'text-gray-400': !database.hasAccess,
                  }"
                />
              </div>
              <div>
                <p class="font-medium text-white">{{ database.name }}</p>
                <p
                  class="text-sm"
                  :class="{
                    'text-green-400': database.hasAccess,
                    'text-gray-400': !database.hasAccess,
                  }"
                >
                  {{
                    database.hasAccess ? "Доступ предоставлен" : "Доступ закрыт"
                  }}
                </p>
              </div>
            </div>
            <UButton
              :icon="
                database.hasAccess
                  ? 'i-heroicons-lock-closed'
                  : 'i-heroicons-lock-open'
              "
              size="sm"
              :color="database.hasAccess ? 'red' : 'green'"
              :loading="togglingDatabaseId === database.id"
              @click="toggleDatabaseAccess(database.id)"
            >
              {{ database.hasAccess ? "Отозвать" : "Предоставить" }}
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Типы данных
interface Member {
  id: number;
  login: string;
  role: string;
}

interface User {
  id: number;
  login: string;
  role: string;
}

interface Database {
  id: number;
  name: string;
  hasAccess: boolean;
}

const route = useRoute();
const toast = useToast();
const teamId = route.params.id as string;

// Состояния
const teamName = ref("");
const members = ref<Member[]>([]);
const availableUsers = ref<User[]>([]);
const databases = ref<Database[]>([]);

// Состояния загрузки
const isLoading = ref(false);
const addingUserId = ref<number | null>(null);
const removingMemberId = ref<number | null>(null);
const togglingDatabaseId = ref<number | null>(null);

// Вычисляемые свойства
const accessibleDatabasesCount = computed(
  () => databases.value.filter((db) => db.hasAccess).length
);

// Загрузка данных команды
const loadTeamInfo = async () => {
  try {
    const response = await $fetch(`/api/admin/teams/${teamId}`);
    if (response && response.team) {
      teamName.value = response.team.name;
    }
  } catch (error) {
    console.error("Ошибка загрузки информации о команде:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить информацию о команде",
      color: "error",
    });
  }
};

// Загрузка участников
const loadMembers = async () => {
  try {
    const response = await $fetch(
      `/api/admin/teams/get-members?teamId=${teamId}`
    );
    if (response && response.members) {
      members.value = response.members;
    }
  } catch (error) {
    console.error("Ошибка загрузки участников:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить список участников",
      color: "error",
    });
  }
};

// Загрузка доступных пользователей
const loadAvailableUsers = async () => {
  try {
    const response = await $fetch(
      `/api/admin/teams/get-available-users?teamId=${teamId}`
    );
    if (response && response.users) {
      availableUsers.value = response.users;
    }
  } catch (error) {
    console.error("Ошибка загрузки доступных пользователей:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить список доступных пользователей",
      color: "error",
    });
  }
};

// Загрузка баз данных
const loadDatabases = async () => {
  try {
    const response = await $fetch(
      `/api/admin/teams/get-databases?teamId=${teamId}`
    );
    if (response && response.databases) {
      databases.value = response.databases;
    }
  } catch (error) {
    console.error("Ошибка загрузки баз данных:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить список баз данных",
      color: "error",
    });
  }
};

// Добавление участника
const addMember = async (userId: number) => {
  addingUserId.value = userId;
  try {
    const response = await $fetch(`/api/admin/teams/add-member`, {
      method: "POST",
      body: { teamId: Number(teamId), userId },
    });

    if (response && response.status === "success") {
      await Promise.all([loadMembers(), loadAvailableUsers()]);
      toast.add({
        title: "Успешно",
        description: "Пользователь добавлен в команду",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Ошибка при добавлении пользователя:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось добавить пользователя в команду",
      color: "error",
    });
  } finally {
    addingUserId.value = null;
  }
};

// Удаление участника
const removeMember = async (userId: number) => {
  removingMemberId.value = userId;
  try {
    const response = await $fetch(`/api/admin/teams/remove-member`, {
      method: "POST",
      body: { teamId: Number(teamId), userId },
    });

    if (response && response.status === "success") {
      await Promise.all([loadMembers(), loadAvailableUsers()]);
      toast.add({
        title: "Успешно",
        description: "Пользователь удален из команды",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить пользователя из команды",
      color: "error",
    });
  } finally {
    removingMemberId.value = null;
  }
};

// Переключение доступа к базе данных
const toggleDatabaseAccess = async (databaseId: number) => {
  const database = databases.value.find((db) => db.id === databaseId);
  if (!database) return;

  togglingDatabaseId.value = databaseId;
  try {
    let response;
    if (database.hasAccess) {
      response = await $fetch(`/api/admin/teams/remove-database`, {
        method: "POST",
        body: { teamId: Number(teamId), databaseId },
      });
    } else {
      response = await $fetch(`/api/admin/teams/add-database`, {
        method: "POST",
        body: { teamId: Number(teamId), databaseId },
      });
    }

    if (response && response.status === "success") {
      database.hasAccess = !database.hasAccess;
      toast.add({
        title: "Успешно",
        description: database.hasAccess
          ? "Доступ к базе данных предоставлен"
          : "Доступ к базе данных отозван",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Ошибка при изменении доступа:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось изменить доступ к базе данных",
      color: "error",
    });
    await loadDatabases();
  } finally {
    togglingDatabaseId.value = null;
  }
};

// Обновление всех данных
const refreshAll = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      loadTeamInfo(),
      loadMembers(),
      loadAvailableUsers(),
      loadDatabases(),
    ]);
  } finally {
    isLoading.value = false;
  }
};

// Загрузка данных при монтировании
onMounted(refreshAll);
</script>
