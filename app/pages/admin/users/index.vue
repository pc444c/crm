<template>
  <div class="flex flex-col gap-4">
    <UCard>
      <u-separator
        color="primary"
        size="xl"
        label="Добавить пользователя (холодку)"
        class="mb-4"
      />
      <form class="flex flex-row items-end gap-4">
        <UFormField label="Логин" class="w-1/4">
          <UInput
            v-model="userInput.login"
            :rules="[(v) => !!v || 'Логин обязателен']"
            :autofocus="true"
            size="xl"
            placeholder="Введи логин"
            type="text"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Пароль" class="w-1/4">
          <UInput
            v-model="userInput.password"
            :rules="[(v) => !!v || 'Пароль обязателен']"
            size="xl"
            placeholder="Введите пароль"
            type="password"
            class="w-full"
          />
        </UFormField>
        <UButton
          icon="i-lucide-rocket"
          size="md"
          color="primary"
          @click.prevent="addUser"
          :disabled="!userInput.login || !userInput.password"
          variant="solid"
          class="w-1/4 flex items-center justify-center"
          >Добавить холодку</UButton
        >
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
const userInput = ref({
  login: "",
  password: "",
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
  try {
    const response = await $fetch("/api/adduser", {
      method: "POST",
      body: userInput.value,
    });
    if (response && response.status === "success") {
      toast.add({
        title: "Успех",
        description: "Пользователь успешно добавлен",
        color: "success",
      });
      // Очищаем поля ввода после успешного добавления
      userInput.value.login = "";
      userInput.value.password = "";
    } else if (response && response.status === "error") {
      toast.add({
        title: "Ошибка",
        description: response.message || "Ошибка при добавлении пользователя",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Ошибка при добавлении пользователя:", error);
    toast.add({
      title: "Ошибка",
      description: "Не удалось добавить пользователя",
      color: "error",
    });
  } finally {
    loadListUser();
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
onMounted(() => {
  loadListUser();
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
