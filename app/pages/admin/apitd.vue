<template>
  <div>
    <h1 class="text-2xl mb-4">Примеры использования API с разными ролями</h1>

    <UCard class="mb-4">
      <template #header>
        <div class="font-bold">Общий API-клиент (без проверки роли)</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UButton
          @click="fetchGeneral"
          color="primary"
          :loading="loadingGeneral"
        >
          Сделать общий запрос
        </UButton>

        <div v-if="generalData" class="bg-neutral-800 p-4 rounded">
          <pre>{{ JSON.stringify(generalData, null, 2) }}</pre>
        </div>
      </div>
    </UCard>

    <UCard class="mb-4">
      <template #header>
        <div class="font-bold">
          User API-клиент (требует роли пользователя или админа)
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UButton @click="fetchUserData" color="info" :loading="loadingUser">
          Сделать запрос пользователя
        </UButton>

        <div v-if="userData" class="bg-neutral-800 p-4 rounded">
          <pre>{{ JSON.stringify(userData, null, 2) }}</pre>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="font-bold">Admin API-клиент (требует роли админа)</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UButton
          @click="fetchAdminData"
          color="warning"
          :loading="loadingAdmin"
        >
          Сделать запрос админа
        </UButton>

        <div v-if="adminData" class="bg-neutral-800 p-4 rounded">
          <pre>{{ JSON.stringify(adminData, null, 2) }}</pre>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { api, userApi, adminApi } from "@/utils/api";

const generalData = ref(null);
const userData = ref(null);
const adminData = ref(null);

const loadingGeneral = ref(false);
const loadingUser = ref(false);
const loadingAdmin = ref(false);

const toast = useToast();

// Пример обычного API-запроса
async function fetchGeneral() {
  loadingGeneral.value = true;
  try {
    generalData.value = await api("/api/basesinfo");
    toast.add({
      title: "Успешно",
      description: "Общий запрос выполнен",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось выполнить запрос",
      color: "error",
    });
    console.error("Ошибка при выполнении запроса:", error);
  } finally {
    loadingGeneral.value = false;
  }
}

// Пример запроса, требующего права пользователя
async function fetchUserData() {
  loadingUser.value = true;
  try {
    userData.value = await userApi("/api/user/getContant", {
      method: "POST",
      body: {
        userId: 1,
      },
    });
    toast.add({
      title: "Успешно",
      description: "Пользовательский запрос выполнен",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось выполнить запрос",
      color: "error",
    });
    console.error("Ошибка при выполнении запроса:", error);
  } finally {
    loadingUser.value = false;
  }
}

// Пример запроса, требующего права администратора
async function fetchAdminData() {
  loadingAdmin.value = true;
  try {
    adminData.value = await adminApi("/api/admin/listtags");
    toast.add({
      title: "Успешно",
      description: "Административный запрос выполнен",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Ошибка",
      description: error.message || "Не удалось выполнить запрос",
      color: "error",
    });
    console.error("Ошибка при выполнении запроса:", error);
  } finally {
    loadingAdmin.value = false;
  }
}
</script>
