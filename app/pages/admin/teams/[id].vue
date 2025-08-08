<template>
  <div>
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
              icon="i-heroicons-pencil"
              variant="outline"
              @click="openEditModal"
            >
              Переименовать
            </UButton>
            <UButton
              icon="i-heroicons-trash"
              variant="outline"
              color="error"
              @click="openDeleteModal"
            >
              Удалить
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
            <div class="p-2 flex justify-center items-center bg-blue-500/20 rounded-lg">
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
            <div class="p-2 flex justify-center items-center bg-green-500/20 rounded-lg">
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
          <div class="flex items-center  gap-3">
            <div class="p-2 flex justify-center items-center bg-purple-500/20 rounded-lg">
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

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- Участники команды -->
        <UCard class="h-fit">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 flex justify-center items-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <UIcon
                    name="i-heroicons-users"
                    class="text-blue-600 dark:text-blue-400 text-xl"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    Участники команды
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Управление участниками
                  </p>
                </div>
              </div>
              <UBadge
                :color="members.length > 0 ? 'success' : 'neutral'"
                variant="soft"
              >
                {{ members.length }} участников
              </UBadge>
            </div>
          </template>

          <!-- Поиск среди участников команды -->
          <div v-if="members.length > 0" class="mb-4">
            <UInput
              v-model="memberSearchQuery"
              placeholder="Поиск участников..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              class="w-full"
            />
          </div>

          <div v-if="isLoading" class="flex justify-center py-12">
            <div class="text-center space-y-3">
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin text-4xl text-blue-400 mx-auto"
              />
              <p class="text-sm text-gray-500">Загрузка участников...</p>
            </div>
          </div>

          <UEmptyState
            v-else-if="members.length === 0"
            icon="i-heroicons-users"
            title="Нет участников"
            description="В команде пока нет участников. Добавьте первого участника из списка доступных пользователей."
            class="py-8"
          />

          <UEmptyState
            v-else-if="filteredMembers.length === 0"
            icon="i-heroicons-magnifying-glass"
            title="Участники не найдены"
            :description="`По запросу '${memberSearchQuery}' ничего не найдено`"
            class="py-4"
          />

          <div v-else class="space-y-3">
            <div
              v-for="member in filteredMembers"
              :key="member.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md"
                >
                  <UIcon name="i-heroicons-user" class="text-white text-lg" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ member.login }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge
                      :color="member.role === 'user' ? 'primary' : 'warning'"
                      variant="soft"
                      size="xs"
                    >
                      {{
                        member.role === "user" ? "Пользователь" : member.role
                      }}
                    </UBadge>
                    <span class="text-xs text-gray-500"
                      >ID: {{ member.id }}</span
                    >
                  </div>
                </div>
              </div>
              <UButton
                icon="i-heroicons-trash"
                size="sm"
                color="error"
                variant="outline"
                class="flex-shrink-0"
                :loading="removingMemberId === member.id"
                @click="removeMember(member.id)"
              >
                Удалить
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Добавление пользователей -->
        <UCard class="h-fit">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-100 flex justify-center items-center dark:bg-purple-900/30 rounded-lg">
                  <UIcon
                    name="i-heroicons-user-plus"
                    class="text-purple-600 dark:text-purple-400 text-xl"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    Добавить пользователей
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Поиск и добавление новых участников
                  </p>
                </div>
              </div>
              <UBadge
                v-if="availableUsers.length > 0"
                color="info"
                variant="soft"
              >
                {{ availableUsers.length }} доступно
              </UBadge>
            </div>
          </template>

          <!-- Поиск пользователей -->
          <div class="mb-6">
            <UFormGroup label="Поиск пользователей">
              <UInput
                v-model="userSearchQuery"
                placeholder="Введите логин пользователя..."
                icon="i-heroicons-magnifying-glass"
                size="lg"
                class="w-full"
              />
              <template #help>
                <span class="text-xs text-gray-500"
                  >Администраторы исключены из поиска</span
                >
              </template>
            </UFormGroup>
          </div>

          <div v-if="isLoading" class="flex justify-center py-12">
            <div class="text-center space-y-3">
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin text-4xl text-purple-400 mx-auto"
              />
              <p class="text-sm text-gray-500">Поиск пользователей...</p>
            </div>
          </div>

          <UEmptyState
            v-else-if="availableUsers.length === 0 && !userSearchQuery.trim()"
            icon="i-heroicons-user-plus"
            title="Нет доступных пользователей"
            description="Все пользователи (кроме админов) уже добавлены в команды. Создайте новых пользователей для расширения команды."
            class="py-8"
          />

          <UEmptyState
            v-else-if="availableUsers.length === 0 && userSearchQuery.trim()"
            icon="i-heroicons-magnifying-glass"
            title="Пользователи не найдены"
            :description="`По запросу '${userSearchQuery}' ничего не найдено. Попробуйте изменить поисковый запрос.`"
            class="py-8"
          />

          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="user in availableUsers"
              :key="user.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md"
                >
                  <UIcon name="i-heroicons-user" class="text-white text-lg" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ user.login }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge
                      :color="user.role === 'user' ? 'primary' : 'warning'"
                      variant="soft"
                      size="xs"
                    >
                      {{ user.role === "user" ? "Пользователь" : user.role }}
                    </UBadge>
                    <span class="text-xs text-gray-500">ID: {{ user.id }}</span>
                  </div>
                </div>
              </div>
              <UButton
                icon="i-heroicons-plus"
                size="sm"
                color="primary"
                variant="solid"
                class="flex-shrink-0"
                :loading="addingUserId === user.id"
                @click="addMember(user.id)"
              >
                Добавить
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Управление базами данных -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UIcon
                  name="i-heroicons-circle-stack"
                  class="text-green-600 dark:text-green-400 text-xl"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Доступ к базам данных
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Управление доступом к базам данных
                </p>
              </div>
            </div>
            <UBadge
              :color="accessibleDatabasesCount > 0 ? 'success' : 'neutral'"
              variant="soft"
            >
              {{ accessibleDatabasesCount }} из {{ databases.length }}
            </UBadge>
          </div>
        </template>

        <!-- Поиск баз данных -->
        <div v-if="databases.length > 0" class="mb-6">
          <UInput
            v-model="databaseSearchQuery"
            placeholder="Поиск баз данных..."
            icon="i-heroicons-magnifying-glass"
            size="sm"
            class="w-full"
          />
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
          <div class="text-center space-y-3">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-4xl text-green-400 mx-auto"
            />
            <p class="text-sm text-gray-500">Загрузка баз данных...</p>
          </div>
        </div>

        <UEmptyState
          v-else-if="databases.length === 0"
          icon="i-heroicons-circle-stack"
          title="Нет баз данных"
          description="В системе пока нет баз данных для назначения командам."
          class="py-8"
        />

        <UEmptyState
          v-else-if="filteredDatabases.length === 0"
          icon="i-heroicons-magnifying-glass"
          title="Базы данных не найдены"
          :description="`По запросу '${databaseSearchQuery}' ничего не найдено`"
          class="py-4"
        />

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="database in filteredDatabases"
            :key="database.id"
            class="p-5 rounded-xl transition-all duration-200 border-2"
            :class="{
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700':
                database.hasAccess,
              'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600':
                !database.hasAccess,
            }"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  :class="{
                    'bg-green-100 dark:bg-green-900/30': database.hasAccess,
                    'bg-gray-100 dark:bg-gray-700': !database.hasAccess,
                  }"
                >
                  <UIcon
                    name="i-heroicons-circle-stack"
                    class="text-xl"
                    :class="{
                      'text-green-600 dark:text-green-400': database.hasAccess,
                      'text-gray-500 dark:text-gray-400': !database.hasAccess,
                    }"
                  />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ database.name }}
                  </p>
                  <p
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600 dark:text-green-400': database.hasAccess,
                      'text-gray-500 dark:text-gray-400': !database.hasAccess,
                    }"
                  >
                    {{
                      database.hasAccess
                        ? "Доступ предоставлен"
                        : "Доступ закрыт"
                    }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <UButton
                :icon="
                  database.hasAccess
                    ? 'i-heroicons-lock-closed'
                    : 'i-heroicons-lock-open'
                "
                size="sm"
                :color="database.hasAccess ? 'error' : 'success'"
                :variant="database.hasAccess ? 'outline' : 'solid'"
                class="w-full justify-center"
                :loading="togglingDatabaseId === database.id"
                @click="toggleDatabaseAccess(database.id)"
              >
                {{
                  database.hasAccess ? "Отозвать доступ" : "Предоставить доступ"
                }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Модальное окно для редактирования команды -->
    <UModal v-model:open="isEditModalOpen" title="Редактирование команды">
      <template #body>
        <UForm :state="editState" class="space-y-6" @submit="updateTeam">
          <!-- Заголовок с иконкой -->
          <div
            class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="p-2 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-pencil-square"
                class="text-blue-600 dark:text-blue-400 text-xl"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Изменить команду
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Обновите информацию о команде
              </p>
            </div>
          </div>

          <!-- Поля формы -->
          <div class="space-y-5">
            <UFormGroup label="Название команды" name="name" required>
              <UInput
                v-model="editState.name"
                placeholder="Введите название команды"
                icon="i-heroicons-tag"
                size="lg"
                :disabled="editLoading"
                class="w-full"
              />
            </UFormGroup>

            <UFormGroup label="Описание команды" name="description">
              <UTextarea
                v-model="editState.description"
                placeholder="Опишите назначение и цели команды..."
                :rows="4"
                size="lg"
                :disabled="editLoading"
                class="w-full resize-none"
              />
              <template #help>
                <span class="text-xs text-gray-500"
                  >Описание поможет участникам понять цель команды</span
                >
              </template>
            </UFormGroup>
          </div>

          <!-- Кнопки -->
          <div
            class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              variant="outline"
              size="lg"
              :disabled="editLoading"
              @click="isEditModalOpen = false"
            >
              Отмена
            </UButton>
            <UButton
              type="submit"
              :loading="editLoading"
              icon="i-heroicons-check"
              size="lg"
            >
              Сохранить изменения
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Модальное окно для удаления команды -->
    <UModal v-model:open="isDeleteModalOpen" title="Удаление команды">
      <template #body>
        <div class="space-y-6">
          <!-- Заголовок с предупреждающей иконкой -->
          <div
            class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="p-2 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="text-red-600 dark:text-red-400 text-xl"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-red-600 dark:text-red-400">
                Подтверждение удаления
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Это действие нельзя отменить
              </p>
            </div>
          </div>

          <!-- Предупреждение -->
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div class="space-y-3">
              <p class="text-gray-900 dark:text-gray-100 font-medium">
                Вы действительно хотите удалить команду
                <span class="font-bold text-red-600 dark:text-red-400"
                  >"{{ teamName }}"</span
                >?
              </p>

              <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-x-circle"
                    class="text-red-500 text-base"
                  />
                  Все участники команды потеряют доступ
                </p>
                <p class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-x-circle"
                    class="text-red-500 text-base"
                  />
                  Доступ к базам данных будет отозван
                </p>
                <p class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-x-circle"
                    class="text-red-500 text-base"
                  />
                  Восстановление невозможно
                </p>
              </div>
            </div>
          </div>

          <!-- Поле подтверждения -->
          <div>
            <UFormGroup
              label="Для подтверждения введите название команды:"
              required
            >
              <UInput
                v-model="deleteConfirmationText"
                :placeholder="teamName"
                size="lg"
                :disabled="deleteLoading"
                class="w-full"
              />
            </UFormGroup>
          </div>

          <!-- Кнопки -->
          <div
            class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              variant="outline"
              size="lg"
              :disabled="deleteLoading"
              @click="isDeleteModalOpen = false"
            >
              Отмена
            </UButton>
            <UButton
              color="error"
              size="lg"
              :loading="deleteLoading"
              :disabled="deleteConfirmationText !== teamName"
              icon="i-heroicons-trash"
              @click="deleteTeam"
            >
              Удалить команду
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
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

// Типы ответов API
interface TeamResponse {
  team: {
    id: number;
    name: string;
  };
}

interface MembersResponse {
  members: Member[];
}

interface UsersResponse {
  users: User[];
}

interface DatabasesResponse {
  databases: Array<{
    id: number;
    name: string;
    hasAccess?: boolean;
  }>;
}

interface ActionResponse {
  status: string;
  message?: string;
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

// Состояние поиска пользователей
const userSearchQuery = ref("");
const memberSearchQuery = ref("");
const databaseSearchQuery = ref("");

// Состояния модальных окон
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);

// Состояния для форм модальных окон
const editLoading = ref(false);
const deleteLoading = ref(false);
const deleteConfirmationText = ref("");

const editState = reactive({
  name: "",
  description: "",
});

// Computed properties
const accessibleDatabasesCount = computed(() => {
  return databases.value.filter((db) => db.hasAccess).length;
});

// Фильтрованные участники команды
const filteredMembers = computed(() => {
  if (!memberSearchQuery.value.trim()) {
    return members.value;
  }
  const query = memberSearchQuery.value.toLowerCase().trim();
  return members.value.filter((member) =>
    member.login.toLowerCase().includes(query)
  );
});

// Фильтрованные базы данных
const filteredDatabases = computed(() => {
  if (!databaseSearchQuery.value.trim()) {
    return databases.value;
  }
  const query = databaseSearchQuery.value.toLowerCase().trim();
  return databases.value.filter((database) =>
    database.name.toLowerCase().includes(query)
  );
});

// Загрузка данных команды
const loadTeamInfo = async () => {
  try {
    const response = await $fetch<TeamResponse>(`/api/admin/teams/${teamId}`);
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
    const response = await $fetch<MembersResponse>(
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
    const searchParam = userSearchQuery.value.trim()
      ? `&search=${encodeURIComponent(userSearchQuery.value.trim())}`
      : "";
    const response = await $fetch<UsersResponse>(
      `/api/admin/teams/get-available-users?teamId=${teamId}${searchParam}`
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
    const response = await $fetch<DatabasesResponse>(
      `/api/admin/teams/get-databases?teamId=${teamId}`
    );
    if (response && response.databases) {
      databases.value = response.databases.map((db) => ({
        id: db.id,
        name: db.name,
        hasAccess: db.hasAccess || false,
      }));
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
    const response = await $fetch<ActionResponse>(
      `/api/admin/teams/add-member`,
      {
        method: "POST",
        body: { teamId: Number(teamId), userId },
      }
    );

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
    const response = await $fetch<ActionResponse>(
      `/api/admin/teams/remove-member`,
      {
        method: "POST",
        body: { teamId: Number(teamId), userId },
      }
    );

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
    let response: ActionResponse;
    if (database.hasAccess) {
      response = await $fetch<ActionResponse>(
        `/api/admin/teams/remove-database`,
        {
          method: "POST",
          body: { teamId: Number(teamId), databaseId },
        }
      );
    } else {
      response = await $fetch<ActionResponse>(`/api/admin/teams/add-database`, {
        method: "POST",
        body: { teamId: Number(teamId), databaseId },
      });
    }

    if (response && response.status === "success") {
      // Обновляем локальное состояние
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
    // Перезагружаем список баз данных в случае ошибки
    await loadDatabases();
  } finally {
    togglingDatabaseId.value = null;
  }
};

// Открытие модального окна редактирования команды
const openEditModal = () => {
  editState.name = teamName.value;
  editState.description = "";
  isEditModalOpen.value = true;
};

// Открытие модального окна удаления команды
const openDeleteModal = () => {
  deleteConfirmationText.value = "";
  isDeleteModalOpen.value = true;
};

// Обновление команды
const updateTeam = async () => {
  if (!editState.name?.trim()) {
    toast.add({
      title: "Ошибка",
      description: "Название команды обязательно",
      color: "error",
    });
    return;
  }

  editLoading.value = true;

  try {
    const response = await $fetch<ActionResponse>(
      `/api/admin/teams/${teamId}`,
      {
        method: "PUT",
        body: {
          name: editState.name.trim(),
          description: editState.description.trim() || undefined,
        },
      }
    );

    if (response && response.status === "success") {
      teamName.value = editState.name.trim();
      isEditModalOpen.value = false;
      toast.add({
        title: "Успешно",
        description: "Команда успешно обновлена",
        color: "success",
      });
    }
  } catch (error: unknown) {
    console.error("Ошибка при обновлении команды:", error);
    let errorMessage = "Не удалось обновить команду";

    if (error && typeof error === "object" && "data" in error) {
      const errorData = error.data as Record<string, unknown>;
      if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  } finally {
    editLoading.value = false;
  }
};

// Удаление команды
const deleteTeam = async () => {
  deleteLoading.value = true;

  try {
    const response = await $fetch<ActionResponse>(
      `/api/admin/teams/${teamId}`,
      {
        method: "DELETE",
      }
    );

    if (response && response.status === "success") {
      toast.add({
        title: "Успешно",
        description: "Команда успешно удалена",
        color: "success",
      });
      await navigateTo("/admin/teams");
    }
  } catch (error: unknown) {
    console.error("Ошибка при удалении команды:", error);
    let errorMessage = "Не удалось удалить команду";

    if (error && typeof error === "object" && "data" in error) {
      const errorData = error.data as Record<string, unknown>;
      if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  } finally {
    deleteLoading.value = false;
    isDeleteModalOpen.value = false;
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

// Debounced поиск пользователей
let searchTimeout: NodeJS.Timeout;
const debouncedUserSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadAvailableUsers();
  }, 300);
};

// Watcher для поиска пользователей
watch(userSearchQuery, () => {
  debouncedUserSearch();
});

// Загрузка данных при монтировании
onMounted(refreshAll);
</script>
