<template>
  <UCard class="p-4 bg-neutral-900 min-w-full h-full">
    <div class="flex justify-between items-center mb-3">
      <USeparator color="secondary" label="Все холодники" class="flex-grow" />
      <UButton
        icon="i-heroicons-arrow-path"
        size="xs"
        color="secondary"
        variant="ghost"
        class="ml-2"
        :loading="loading"
        @click="loadAllUsers"
      />
    </div>

    <!-- Статистика всегда видна -->
    <div class="flex justify-between text-xs text-gray-400 mb-2 px-3">
      <span>Всего: {{ allUsers.length }}</span>
      <span>Онлайн: {{ onlineCount }}</span>
    </div>

    <div
      class="max-h-80 min-h-[200px] overflow-y-auto flex flex-col gap-2 custom-scrollbar relative"
    >
      <!-- Оверлей загрузки -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-neutral-900/70 flex items-center justify-center z-10"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="text-secondary-500 w-6 h-6 animate-spin"
        />
      </div>

      <div
        v-if="allUsers.length === 0 && !loading"
        class="text-center py-4 text-gray-400"
      >
        Нет пользователей
      </div>
      <div
        v-for="(user, index) in allUsers"
        :key="user.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-900 transition"
      >
        <div
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-full"
          :class="
            user.is_online === 'online' ? 'bg-primary-700' : 'bg-secondary-700'
          "
        >
          {{ index + 1 }}
        </div>
        <span class="text-base text-white">{{ user.login }}</span>
        <span
          class="text-xs ml-auto px-2 py-1 rounded-full"
          :class="
            user.is_online === 'online'
              ? 'bg-primary-900 text-primary-300'
              : 'bg-gray-800 text-gray-400'
          "
        >
          {{ user.is_online === "online" ? "онлайн" : "оффлайн" }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

interface User {
  id: number;
  login: string;
  role: string;
  last_activity: string | null;
  is_online: string;
  created_at: string;
}

const allUsers = ref<User[]>([]);
const loading = ref(false);

// Количество пользователей онлайн
const onlineCount = computed(() => {
  return allUsers.value.filter((user) => user.is_online === "online").length;
});

// Загрузка всех пользователей
const loadAllUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/admin/getUsersWithStatus");
    const data = await response.json();

    if (data && data.status === "success") {
      // Фильтруем только пользователей с ролью "user" и сортируем по статусу
      // (онлайн вверху) и времени последней активности
      allUsers.value = (data.users || [])
        .filter((user: User) => user.role === "user")
        .sort((a: User, b: User) => {
          // Сначала сортируем по онлайн статусу
          if (a.is_online === "online" && b.is_online !== "online") return -1;
          if (a.is_online !== "online" && b.is_online === "online") return 1;

          // Затем по времени последней активности
          if (!a.last_activity) return 1;
          if (!b.last_activity) return -1;
          return (
            new Date(b.last_activity).getTime() -
            new Date(a.last_activity).getTime()
          );
        });
    } else {
      console.error("Ошибка при загрузке пользователей:", data);
    }
  } catch (error) {
    console.error("Ошибка при загрузке пользователей:", error);
  } finally {
    loading.value = false;
  }
};

// Загружаем пользователей при монтировании компонента
onMounted(() => {
  loadAllUsers();

  // Обновляем список каждые 10 секунд для более точной статистики
  const interval = setInterval(loadAllUsers, 10000);

  // Очищаем интервал при размонтировании
  onUnmounted(() => clearInterval(interval));
});
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  /* Use actual color values or valid CSS variables */
  scrollbar-color: var(--ui-color-secondary-500) #18181b; /* thumb color (green), track color */
}

/* Chrome, Edge, Safari */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  border-radius: 8px;
  background: #18181b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #22c55e;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4ade80;
}
</style>
