<template>
  <div class="flex flex-col gap-6">
    <!-- Хедер с информацией о команде -->
    <UCard>
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-white">{{ teamName }}</h1>
          <p class="text-gray-400 mt-1">Управление участниками и доступами</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="outline"
            color="neutral"
            @click="$router.back()"
          >
            Назад
          </UButton>
          <UButton
            icon="i-heroicons-arrow-path"
            variant="outline"
            :loading="isLoadingAny"
            @click="refreshAll"
          >
            Обновить
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Статистика команды -->
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
      <!-- Управление участниками команды -->
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

        <div v-if="isLoadingMembers" class="flex justify-center py-8">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-4xl text-blue-400"
          />
        </div>

        <UEmptyState
          v-else-if="members.length === 0"
          icon="i-heroicons-users"
          title="Команда пуста"
          description="В этой команде пока нет участников"
        />

        <div v-else class="space-y-3">
          <div v-if="members.length > 5">
            <UInput
              v-model="memberSearchQuery"
              placeholder="Поиск участников..."
              icon="i-heroicons-magnifying-glass"
              class="mb-4"
            />
          </div>

          <UCard
            v-for="member in filteredMembers"
            :key="member.id"
            class="border border-gray-700"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-700 rounded-full">
                  <UIcon name="i-heroicons-user" class="text-gray-300" />
                </div>
                <div>
                  <h4 class="font-medium text-white">{{ member.login }}</h4>
                  <div class="flex items-center gap-2 text-sm text-gray-400">
                    <span>ID: {{ member.id }}</span>
                    <UBadge
                      :color="member.role === 'admin' ? 'warning' : 'primary'"
                      size="xs"
                    >
                      {{
                        member.role === "admin" ? "Администратор" : "Оператор"
                      }}
                    </UBadge>
                  </div>
                </div>
              </div>
              <UButton
                color="error"
                variant="soft"
                icon="i-heroicons-user-minus"
                size="sm"
                :loading="removingMemberId === member.id"
                @click="removeMember(member.id)"
              >
                Удалить
              </UButton>
            </div>
          </UCard>
        </div>
      </UCard>

      <!-- Добавление новых участников -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user-plus" class="text-green-400" />
              <h3 class="text-lg font-semibold">Добавить участников</h3>
            </div>
            <UButton
              v-if="availableUsers.length > 0"
              icon="i-heroicons-plus"
              size="sm"
              @click="showAddMembersModal = true"
            >
              Быстрое добавление
            </UButton>
          </div>
        </template>

        <div v-if="isLoadingAvailableUsers" class="flex justify-center py-8">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-4xl text-green-400"
          />
        </div>

        <UEmptyState
          v-else-if="availableUsers.length === 0"
          icon="i-heroicons-check-circle"
          title="Все пользователи добавлены"
          description="Все доступные пользователи уже состоят в команде"
        />

        <div v-else class="space-y-3">
          <div v-if="availableUsers.length > 5">
            <UInput
              v-model="userSearchQuery"
              placeholder="Поиск пользователей..."
              icon="i-heroicons-magnifying-glass"
              class="mb-4"
            />
          </div>

          <UCard
            v-for="user in filteredAvailableUsers"
            :key="user.id"
            class="border border-gray-700"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-700 rounded-full">
                  <UIcon name="i-heroicons-user" class="text-gray-300" />
                </div>
                <div>
                  <h4 class="font-medium text-white">{{ user.login }}</h4>
                  <div class="flex items-center gap-2 text-sm text-gray-400">
                    <span>ID: {{ user.id }}</span>
                    <UBadge
                      :color="user.role === 'admin' ? 'warning' : 'primary'"
                      size="xs"
                    >
                      {{ user.role === "admin" ? "Администратор" : "Оператор" }}
                    </UBadge>
                  </div>
                </div>
              </div>
              <UButton
                color="primary"
                variant="soft"
                icon="i-heroicons-user-plus"
                size="sm"
                :loading="addingUserId === user.id"
                @click="addMember(user.id)"
              >
                Добавить
              </UButton>
            </div>
          </UCard>
        </div>
      </UCard>
    </div>

    <!-- Управление доступом к базам данных -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-circle-stack" class="text-purple-400" />
            <h3 class="text-lg font-semibold">Доступ к базам данных</h3>
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="success">
              {{ accessibleDatabasesCount }} / {{ databases.length }} доступно
            </UBadge>
            <UButton
              v-if="databases.length > 0"
              icon="i-heroicons-cog-6-tooth"
              size="sm"
              @click="showBulkDatabaseModal = true"
            >
              Массовые действия
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="isLoadingDatabases" class="flex justify-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-4xl text-purple-400"
        />
      </div>

      <UEmptyState
        v-else-if="databases.length === 0"
        icon="i-heroicons-circle-stack"
        title="Базы данных не найдены"
        description="В системе пока нет баз данных для настройки доступа"
      />

      <div v-else>
        <div v-if="databases.length > 6" class="mb-4">
          <UInput
            v-model="databaseSearchQuery"
            placeholder="Поиск баз данных..."
            icon="i-heroicons-magnifying-glass"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="database in filteredDatabases"
            :key="database.id"
            :class="[
              'border cursor-pointer transition-all duration-200 hover:scale-105 relative',
              database.hasAccess
                ? 'border-green-500 bg-green-900/20 hover:bg-green-900/30'
                : 'border-gray-600 hover:border-gray-500',
            ]"
            @click="toggleDatabaseAccess(database.id)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-white truncate">
                  {{ database.name }}
                </h4>
                <p class="text-xs text-gray-400 mt-1">ID: {{ database.id }}</p>
              </div>
              <div class="ml-2">
                <UBadge
                  :color="database.hasAccess ? 'success' : 'neutral'"
                  size="xs"
                >
                  <UIcon
                    :name="
                      database.hasAccess
                        ? 'i-heroicons-check-circle'
                        : 'i-heroicons-x-circle'
                    "
                    class="mr-1"
                  />
                  {{ database.hasAccess ? "Доступ" : "Нет доступа" }}
                </UBadge>
              </div>
            </div>

            <div
              v-if="togglingDatabaseId === database.id"
              class="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg"
            >
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin text-white text-xl"
              />
            </div>
          </UCard>
        </div>
      </div>
    </UCard>

    <!-- Модальное окно для быстрого добавления участников -->
    <UModal v-model="showAddMembersModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-plus" class="text-green-400" />
            <h3 class="text-lg font-semibold">Быстрое добавление участников</h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-400">
            Выберите пользователей для добавления в команду:
          </p>

          <div class="max-h-96 overflow-y-auto space-y-2">
            <UCard
              v-for="user in availableUsers"
              :key="user.id"
              class="border border-gray-700 cursor-pointer hover:border-gray-500"
              @click="toggleUserSelection(user.id)"
            >
              <div class="flex items-center gap-3">
                <UCheckbox
                  :model-value="selectedUserIds.includes(user.id)"
                  @update:model-value="toggleUserSelection(user.id)"
                />
                <div class="flex-1">
                  <h4 class="font-medium">{{ user.login }}</h4>
                  <p class="text-sm text-gray-400">
                    {{ user.role === "admin" ? "Администратор" : "Оператор" }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="showAddMembersModal = false">
              Отмена
            </UButton>
            <UButton
              :disabled="selectedUserIds.length === 0"
              :loading="isBulkAdding"
              @click="bulkAddMembers"
            >
              Добавить ({{ selectedUserIds.length }})
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Модальное окно для массовых действий с базами -->
    <UModal v-model="showBulkDatabaseModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="text-purple-400" />
            <h3 class="text-lg font-semibold">
              Массовые действия с базами данных
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex gap-2">
            <UButton
              variant="outline"
              :loading="isBulkTogglingDatabases"
              @click="bulkToggleDatabases(true)"
            >
              Предоставить доступ ко всем
            </UButton>
            <UButton
              variant="outline"
              color="error"
              :loading="isBulkTogglingDatabases"
              @click="bulkToggleDatabases(false)"
            >
              Отозвать доступ ко всем
            </UButton>
          </div>

          <div class="p-4 bg-gray-800 rounded-lg">
            <p class="text-sm text-gray-300">
              Доступно баз:
              <span class="font-medium text-green-400">{{
                accessibleDatabasesCount
              }}</span>
              из {{ databases.length }}
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton variant="outline" @click="showBulkDatabaseModal = false">
              Закрыть
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const teamId = route.params.id as string;
const teamName = ref("");

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

// Состояния
const members = ref<Member[]>([]);
const availableUsers = ref<User[]>([]);
const databases = ref<Database[]>([]);

const isLoadingMembers = ref(false);
const isLoadingAvailableUsers = ref(false);
const isLoadingDatabases = ref(false);

const removingMemberId = ref<number | null>(null);
const addingUserId = ref<number | null>(null);
const togglingDatabaseId = ref<number | null>(null);

// Новые состояния для поиска и модальных окон
const memberSearchQuery = ref("");
const userSearchQuery = ref("");
const databaseSearchQuery = ref("");

const showAddMembersModal = ref(false);
const showBulkDatabaseModal = ref(false);

const selectedUserIds = ref<number[]>([]);
const isBulkAdding = ref(false);
const isBulkTogglingDatabases = ref(false);

// Вычисляемые свойства
const isLoadingAny = computed(
  () =>
    isLoadingMembers.value ||
    isLoadingAvailableUsers.value ||
    isLoadingDatabases.value
);

const accessibleDatabasesCount = computed(
  () => databases.value.filter((db) => db.hasAccess).length
);

const filteredMembers = computed(() => {
  if (!memberSearchQuery.value) return members.value;
  return members.value.filter((member) =>
    member.login.toLowerCase().includes(memberSearchQuery.value.toLowerCase())
  );
});

const filteredAvailableUsers = computed(() => {
  if (!userSearchQuery.value) return availableUsers.value;
  return availableUsers.value.filter((user) =>
    user.login.toLowerCase().includes(userSearchQuery.value.toLowerCase())
  );
});

const filteredDatabases = computed(() => {
  if (!databaseSearchQuery.value) return databases.value;
  return databases.value.filter((database) =>
    database.name
      .toLowerCase()
      .includes(databaseSearchQuery.value.toLowerCase())
  );
});

// Методы для модальных окон
const toggleUserSelection = (userId: number) => {
  const index = selectedUserIds.value.indexOf(userId);
  if (index > -1) {
    selectedUserIds.value.splice(index, 1);
  } else {
    selectedUserIds.value.push(userId);
  }
};

const bulkAddMembers = async () => {
  if (selectedUserIds.value.length === 0) return;

  isBulkAdding.value = true;
  try {
    const promises = selectedUserIds.value.map((userId) =>
      $fetch(`/api/admin/teams/${teamId}/members`, {
        method: "POST",
        body: { user_id: userId },
      })
    );

    await Promise.all(promises);

    selectedUserIds.value = [];
    showAddMembersModal.value = false;

    await Promise.all([loadMembers(), loadAvailableUsers()]);

    toast.add({
      title: "Успешно",
      description: "Участники добавлены в команду",
      color: "success",
    });
  } catch (error) {
    console.error("Ошибка при массовом добавлении участников:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось добавить всех участников",
      color: "error",
    });
  } finally {
    isBulkAdding.value = false;
  }
};

const bulkToggleDatabases = async (grantAccess: boolean) => {
  isBulkTogglingDatabases.value = true;
  try {
    const targetDatabases = databases.value.filter(
      (db) => db.hasAccess !== grantAccess
    );

    const promises = targetDatabases.map((database) => {
      if (grantAccess) {
        return $fetch(`/api/admin/teams/${teamId}/databases`, {
          method: "POST",
          body: { database_id: database.id },
        });
      } else {
        return $fetch(`/api/admin/teams/${teamId}/databases/${database.id}`, {
          method: "DELETE",
        });
      }
    });

    await Promise.all(promises);
    await loadDatabases();

    toast.add({
      title: "Успешно",
      description: grantAccess
        ? "Доступ предоставлен ко всем базам"
        : "Доступ отозван ко всем базам",
      color: "success",
    });
  } catch (error) {
    console.error("Ошибка при массовом изменении доступа:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось изменить доступ ко всем базам",
      color: "error",
    });
  } finally {
    isBulkTogglingDatabases.value = false;
  }
};

const refreshAll = async () => {
  await Promise.all([
    loadTeamInfo(),
    loadMembers(),
    loadAvailableUsers(),
    loadDatabases(),
  ]);
};

// Загрузка основной информации о команде
const loadTeamInfo = async () => {
  try {
    console.log("UI: Загрузка информации о команде, teamId:", teamId);

    const response = (await $fetch(`/api/admin/teams/${teamId}`)) as any;
    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success" && response.team) {
      teamName.value = response.team.name || `Команда #${teamId}`;
    } else {
      teamName.value = `Команда #${teamId}`;
    }
  } catch (error) {
    console.error("Ошибка при загрузке информации о команде:", error);
    teamName.value = `Команда #${teamId}`;
  }
};

// Загрузка участников команды
const loadMembers = async () => {
  isLoadingMembers.value = true;
  try {
    console.log("UI: Загрузка участников команды:", teamId);
    const response = (await $fetch(
      `/api/admin/teams/${teamId}/members`
    )) as any;
    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      members.value = response.members || [];
      console.log("UI: Участники команды загружены:", members.value.length);
    } else {
      throw new Error(
        response?.message || "Не удалось загрузить участников команды"
      );
    }
  } catch (error) {
    console.error("Ошибка при загрузке участников команды:", error);

    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить участников команды",
      color: "error",
    });
  } finally {
    isLoadingMembers.value = false;
  }
};

// Загрузка доступных пользователей для добавления в команду
const loadAvailableUsers = async () => {
  isLoadingAvailableUsers.value = true;
  try {
    console.log("UI: Загрузка доступных пользователей");
    const response = (await $fetch(
      `/api/admin/teams/${teamId}/available-users`
    )) as any;
    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      availableUsers.value = response.users || [];
      console.log(
        "UI: Доступные пользователи загружены:",
        availableUsers.value.length
      );
    } else {
      throw new Error(
        response?.message || "Не удалось загрузить доступных пользователей"
      );
    }
  } catch (error) {
    console.error("Ошибка при загрузке доступных пользователей:", error);

    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить доступных пользователей",
      color: "error",
    });
  } finally {
    isLoadingAvailableUsers.value = false;
  }
};

// Загрузка баз данных и доступа к ним
const loadDatabases = async () => {
  isLoadingDatabases.value = true;
  try {
    console.log("UI: Загрузка баз данных");
    const response = (await $fetch(
      `/api/admin/teams/${teamId}/databases`
    )) as any;
    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      databases.value = response.databases || [];
      console.log("UI: Базы данных загружены:", databases.value.length);
    } else {
      throw new Error(response?.message || "Не удалось загрузить базы данных");
    }
  } catch (error) {
    console.error("Ошибка при загрузке баз данных:", error);

    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить базы данных",
      color: "error",
    });
  } finally {
    isLoadingDatabases.value = false;
  }
};

// Добавление пользователя в команду
const addMember = async (userId: number) => {
  addingUserId.value = userId;
  try {
    console.log("UI: Добавление пользователя в команду, userId:", userId);

    const response = (await $fetch(`/api/admin/teams/${teamId}/members`, {
      method: "POST",
      body: { user_id: userId },
    })) as any;

    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      // Обновляем списки участников и доступных пользователей
      await Promise.all([loadMembers(), loadAvailableUsers()]);

      toast.add({
        title: "Успешно",
        description: "Пользователь добавлен в команду",
        color: "success",
      });
    } else {
      throw new Error(
        response?.message || "Не удалось добавить пользователя в команду"
      );
    }
  } catch (error) {
    console.error("Ошибка при добавлении пользователя в команду:", error);

    toast.add({
      title: "Ошибка",
      description:
        error instanceof Error
          ? error.message
          : "Не удалось добавить пользователя в команду",
      color: "error",
    });
  } finally {
    addingUserId.value = null;
  }
};

// Удаление пользователя из команды
const removeMember = async (userId: number) => {
  removingMemberId.value = userId;
  try {
    console.log("UI: Удаление пользователя из команды, userId:", userId);

    const response = (await $fetch(
      `/api/admin/teams/${teamId}/members/${userId}`,
      {
        method: "DELETE",
      }
    )) as any;

    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      // Обновляем списки участников и доступных пользователей
      await Promise.all([loadMembers(), loadAvailableUsers()]);

      toast.add({
        title: "Успешно",
        description: "Пользователь удален из команды",
        color: "success",
      });
    } else {
      throw new Error(
        response?.message || "Не удалось удалить пользователя из команды"
      );
    }
  } catch (error) {
    console.error("Ошибка при удалении пользователя из команды:", error);

    toast.add({
      title: "Ошибка",
      description:
        error instanceof Error
          ? error.message
          : "Не удалось удалить пользователя из команды",
      color: "error",
    });
  } finally {
    removingMemberId.value = null;
  }
};

// Изменение доступа к базе данных для команды
const toggleDatabaseAccess = async (databaseId: number) => {
  togglingDatabaseId.value = databaseId;

  try {
    const database = databases.value.find((db) => db.id === databaseId);
    if (!database) return;

    console.log(
      "UI: Изменение доступа к базе данных, databaseId:",
      databaseId,
      "текущий доступ:",
      database.hasAccess
    );

    let response;
    if (database.hasAccess) {
      // Если доступ есть, отзываем его
      response = (await $fetch(
        `/api/admin/teams/${teamId}/databases/${databaseId}`,
        {
          method: "DELETE",
        }
      )) as any;
    } else {
      // Если доступа нет, выдаем его
      response = (await $fetch(`/api/admin/teams/${teamId}/databases`, {
        method: "POST",
        body: { database_id: databaseId },
      })) as any;
    }

    console.log("UI: Получен ответ:", response);

    if (response && response.status === "success") {
      // Инвертируем значение hasAccess
      database.hasAccess = !database.hasAccess;

      toast.add({
        title: "Успешно",
        description: database.hasAccess
          ? "Доступ к базе данных предоставлен"
          : "Доступ к базе данных отозван",
        color: "success",
      });
    } else {
      throw new Error(
        response?.message || "Не удалось изменить доступ к базе данных"
      );
    }
  } catch (error) {
    console.error("Ошибка при изменении доступа к базе данных:", error);

    toast.add({
      title: "Ошибка",
      description:
        error instanceof Error
          ? error.message
          : "Не удалось изменить доступ к базе данных",
      color: "error",
    });

    // Перезагружаем список баз данных для актуализации состояния
    await loadDatabases();
  } finally {
    togglingDatabaseId.value = null;
  }
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  loadTeamInfo();
  loadMembers();
  loadAvailableUsers();
  loadDatabases();
});
</script>
