<template>
  <div class="flex flex-col gap-6">
    <UCard
      class="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
    >
      <div class="flex items-center gap-3 mb-6">
        <div class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
          <Icon
            name="i-lucide-user-plus"
            class="w-6 h-6 text-primary-600 dark:text-primary-400"
          />
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            Добавить пользователя
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Создание нового пользователя (холодки) в системе
          </p>
        </div>
      </div>

      <form
        class="flex flex-col lg:flex-row items-end gap-4"
        @submit.prevent="addUser"
      >
        <UFormField label="Логин" class="flex-1 lg:w-1/5">
          <UInput
            v-model="userInput.login"
            :rules="[(v) => !!v || 'Логин обязателен']"
            :autofocus="true"
            size="xl"
            placeholder="Введите логин пользователя"
            type="text"
            class="w-full"
            :disabled="isAddingUser"
          />
        </UFormField>
        <UFormField label="Пароль" class="flex-1 lg:w-1/5">
          <UInput
            v-model="userInput.password"
            :rules="[(v) => !!v || 'Пароль обязателен']"
            size="xl"
            placeholder="Введите пароль"
            type="password"
            class="w-full"
            :disabled="isAddingUser"
          />
        </UFormField>
        <UFormField label="Команда (необязательно)" class="flex-1 lg:w-1/5">
          <USelect
            v-model="userInput.teamId"
            :items="teamsOptions"
            placeholder="Выберите команду"
            :loading="isLoadingTeams"
            size="xl"
            value-key="value"
            :disabled="isAddingUser"
          />
        </UFormField>
        <div class="flex-1 lg:w-1/5 flex flex-col justify-end">
          <UButton
            type="submit"
            size="xl"
            color="primary"
            variant="solid"
            :disabled="!userInput.login || !userInput.password || isAddingUser"
            :loading="isAddingUser"
            class="w-full justify-center font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            <template v-if="!isAddingUser">
              <Icon name="i-lucide-user-plus" class="w-5 h-5 mr-2" />
              Добавить холодку
            </template>
            <template v-else>
              <Icon
                name="i-lucide-loader-2"
                class="w-5 h-5 mr-2 animate-spin"
              />
              Добавление...
            </template>
          </UButton>
        </div>
      </form>
    </UCard>
    <UCard>
      <div class="flex flex-row justify-between items-center mb-2">
        <UInput
          v-model="search"
          placeholder="Поиск по логину..."
          size="md"
          class="w-1/3"
        />
        <div>
          <span>Страница {{ page }} из {{ totalPages }}</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table
          class="min-w-full border-separate border-primary-500 font-mono rounded-lg shadow"
        >
          <thead>
            <tr>
              <th
                @click="sortBy('id')"
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b cursor-pointer select-none"
              >
                ID
                <span v-if="sort.key === 'id'">{{
                  sort.order === "asc" ? "▲" : "▼"
                }}</span>
              </th>
              <th
                @click="sortBy('created_at')"
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b cursor-pointer select-none"
              >
                Дата
                <span v-if="sort.key === 'created_at'">{{
                  sort.order === "asc" ? "▲" : "▼"
                }}</span>
              </th>
              <th
                @click="sortBy('login')"
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b cursor-pointer select-none"
              >
                Логин
                <span v-if="sort.key === 'login'">{{
                  sort.order === "asc" ? "▲" : "▼"
                }}</span>
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Уволить
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Пароль
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in sortedFilteredPaginatedData"
              :key="row.id"
              class="border-b border-primary-500"
            >
              <td class="px-4 py-2">{{ row.id }}</td>
              <td class="px-4 py-2">{{ formatDate(row.created_at) }}</td>
              <td class="px-4 py-2">{{ row.login }}</td>
              <td class="px-4 py-2">
                <UButton
                  color="error"
                  icon="line-md:trash"
                  @click="openDeleteModal(row)"
                  >Уволить</UButton
                >
              </td>
              <td class="px-4 py-2">
                <UButton
                  color="warning"
                  icon="line-md:pencil"
                  @click="openPasswordModal(row)"
                  >Изменить</UButton
                >
              </td>
            </tr>
            <tr v-if="sortedFilteredPaginatedData.length === 0">
              <td colspan="5" class="text-center py-4 text-gray-400">
                Нет данных
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end mt-4 gap-2">
        <UButton :disabled="page === 1" @click="page--" size="sm"
          >Назад</UButton
        >
        <UButton :disabled="page === totalPages" @click="page++" size="sm"
          >Вперёд</UButton
        >
      </div>
    </UCard>

    <!-- Модальное окно для удаления пользователя -->
    <UModal v-model:open="deleteModal.isOpen" title="Ты точно хочешь уволить?">
      <template #body>
        <div class="flex flex-col gap-2">
          <span>
            Вы уверены, что хотите уволить холодку
            <strong>{{ deleteModal.user?.login }}</strong
            >? Это действие нельзя отменить.
          </span>
          <div class="flex flex-row gap-4">
            <UButton
              color="error"
              size="md"
              class="mt-4 max-w-max"
              icon="i-lucide-check"
              @click="deleteUser"
              >Да, уволить</UButton
            >
            <UButton
              color="secondary"
              size="md"
              class="mt-4 max-w-max"
              icon="i-lucide-x"
              close
              @click="deleteModal.isOpen = false"
              >Нет, отменить</UButton
            >
          </div>
        </div>
      </template>
    </UModal>

    <!-- Модальное окно для изменения пароля -->
    <UModal v-model:open="passwordModal.isOpen" title="Изменить пароль">
      <template #body>
        <div class="flex flex-col gap-2">
          <span>
            Изменение пароля для пользователя
            <strong>{{ passwordModal.user?.login }}</strong>
          </span>
          <UFormField label="Новый пароль" class="mt-2">
            <UInput
              v-model="passwordModal.newPassword"
              size="xl"
              placeholder="Введите новый пароль"
              type="password"
              class="w-full"
            />
          </UFormField>
          <div class="flex flex-row gap-4">
            <UButton
              color="warning"
              size="md"
              class="mt-4 max-w-max"
              icon="i-lucide-check"
              @click="changePassword"
              :disabled="!passwordModal.newPassword"
              >Сохранить</UButton
            >
            <UButton
              color="secondary"
              size="md"
              class="mt-4 max-w-max"
              icon="i-lucide-x"
              close
              @click="passwordModal.isOpen = false"
              >Отмена</UButton
            >
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { UButton } from "#components";
interface User {
  id: number;
  login: string;
  role?: string;
  created_at: string;
}

const deleteModal = ref({
  isOpen: false,
  user: null as User | null,
});

const passwordModal = ref({
  isOpen: false,
  user: null as User | null,
  newPassword: "",
});

const search = ref("");
const page = ref(1);
const pageSize = 10;
const isAddingUser = ref(false);
const userInput = ref({
  login: "",
  password: "",
  teamId: null as number | null,
});

// Для команд
const teams = ref<{ id: number; name: string }[]>([]);
const isLoadingTeams = ref(false);
const teamsOptions = computed(() => {
  console.log("Пересчитываются опции команд, teams.value:", teams.value);
  const options = [
    { label: "Без команды", value: null },
    ...teams.value.map((team) => ({
      label: team.name,
      value: team.id,
    })),
  ];
  console.log("Готовые опции:", options);
  return options;
});
const data = ref<User[]>([]);
const toast = useToast();

type SortableKey = "id" | "login" | "created_at";

const sort = ref<{ key: SortableKey; order: "asc" | "desc" }>({
  key: "id",
  order: "asc",
});

function sortBy(key: SortableKey) {
  if (sort.value.key === key) {
    sort.value.order = sort.value.order === "asc" ? "desc" : "asc";
  } else {
    sort.value.key = key;
    sort.value.order = "asc";
  }
}

const sortedFilteredPaginatedData = computed(() => {
  let filtered = data.value;
  if (search.value) {
    filtered = filtered.filter((row) =>
      row.login.toLowerCase().includes(search.value.toLowerCase())
    );
  }
  const sorted = [...filtered].sort((a, b) => {
    const key = sort.value.key;
    let aVal: any;
    let bVal: any;

    // Правильно получаем значения по ключу
    switch (key) {
      case "id":
        aVal = a.id;
        bVal = b.id;
        break;
      case "login":
        aVal = a.login;
        bVal = b.login;
        break;
      case "created_at":
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
    }

    if (aVal < bVal) return sort.value.order === "asc" ? -1 : 1;
    if (aVal > bVal) return sort.value.order === "asc" ? 1 : -1;
    return 0;
  });
  const start = (page.value - 1) * pageSize;
  return sorted.slice(start, start + pageSize);
});

const totalPages = computed(() =>
  Math.max(
    1,
    Math.ceil(
      (search.value
        ? data.value.filter((row) =>
            row.login.toLowerCase().includes(search.value.toLowerCase())
          ).length
        : data.value.length) / pageSize
    )
  )
);

watch([search, sort], () => {
  page.value = 1;
});
async function addUser() {
  if (!userInput.value.login || !userInput.value.password) {
    return;
  }

  isAddingUser.value = true;
  try {
    const response = await $fetch("/api/adduser", {
      method: "POST",
      body: userInput.value,
    });
    if (response && response.status === "success") {
      toast.add({
        title: "Успех! 🎉",
        description: `Холодка "${userInput.value.login}" успешно добавлена в систему`,
        color: "success",
      });
      // Очищаем поля ввода после успешного добавления
      userInput.value.login = "";
      userInput.value.password = "";
      userInput.value.teamId = null;

      // Обновляем список пользователей
      await loadListUser();
    } else if (response && response.status === "error") {
      toast.add({
        title: "Ошибка ❌",
        description: response.message || "Ошибка при добавлении пользователя",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Ошибка при добавлении пользователя:", error);
    toast.add({
      title: "Ошибка ❌",
      description:
        "Не удалось добавить пользователя. Проверьте подключение к серверу.",
      color: "error",
    });
  } finally {
    isAddingUser.value = false;
  }
}
const loadListUser = async () => {
  try {
    const response = await $fetch("/api/listuser");
    data.value = response.users || [];
  } catch (error) {
    console.error("Ошибка при загрузке списка пользователей:", error);
  }
};
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
// Загружаем команды
const loadTeams = async () => {
  isLoadingTeams.value = true;
  try {
    const response = await $fetch("/api/admin/teams/list");
    console.log("Ответ API команд:", response);
    if (response && response.status === "success") {
      teams.value = response.teams || [];
      console.log("Команды загружены:", teams.value);
      console.log("Опции для селекта:", teamsOptions.value);
    }
  } catch (error) {
    console.error("Ошибка при загрузке списка команд:", error);
  } finally {
    isLoadingTeams.value = false;
  }
};

onMounted(() => {
  loadListUser();
  loadTeams();
});

// Функция открытия модального окна для удаления
function openDeleteModal(user: User) {
  deleteModal.value.user = user;
  deleteModal.value.isOpen = true;
}

// Функция открытия модального окна для изменения пароля
function openPasswordModal(user: User) {
  passwordModal.value.user = user;
  passwordModal.value.newPassword = "";
  passwordModal.value.isOpen = true;
}

// Функция для удаления пользователя
async function deleteUser() {
  if (!deleteModal.value.user) return;

  try {
    const response = await $fetch("/api/deleteuser", {
      method: "POST",
      body: { id: deleteModal.value.user.id },
    });

    if (response && response.status === "success") {
      toast.add({
        title: "Успех",
        description: "Пользователь успешно удален",
        color: "success",
      });
      deleteModal.value.isOpen = false;
      loadListUser();
    } else {
      throw new Error(response.message || "Ошибка при удалении пользователя");
    }
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось удалить пользователя",
      color: "error",
    });
  }
}

// Функция для изменения пароля
async function changePassword() {
  if (!passwordModal.value.newPassword || !passwordModal.value.user) return;

  try {
    const response = await $fetch("/api/changepassword", {
      method: "POST",
      body: {
        id: passwordModal.value.user.id,
        newPassword: passwordModal.value.newPassword,
      },
    });

    if (response && response.status === "success") {
      toast.add({
        title: "Успех",
        description: "Пароль успешно изменен",
        color: "success",
      });
      passwordModal.value.isOpen = false;
    } else {
      throw new Error(response.message || "Ошибка при изменении пароля");
    }
  } catch (error) {
    console.error("Ошибка при изменении пароля:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось изменить пароль",
      color: "error",
    });
  }
}
</script>
