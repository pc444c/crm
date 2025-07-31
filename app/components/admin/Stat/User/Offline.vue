<template>
  <UCard class="p-4 bg-neutral-900 min-w-full h-full">
    <div class="flex justify-between items-center mb-3">
      <USeparator
        color="error"
        label="Все оффлайн холодники"
        class="flex-grow"
      />
      <UButton
        icon="i-heroicons-arrow-path"
        size="xs"
        color="error"
        variant="ghost"
        class="ml-2"
        :loading="loading"
        @click="loadOfflineUsers"
      />
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
          class="text-error-500 w-6 h-6 animate-spin"
        />
      </div>

      <div
        v-if="offlineUsers.length === 0 && !loading"
        class="text-center py-4 text-gray-400"
      >
        Нет пользователей оффлайн
      </div>
      <div
        v-for="(user, index) in offlineUsers"
        :key="user.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error-900 transition"
      >
        <div
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-error-700 text-white text-base"
        >
          {{ index + 1 }}
        </div>
        <span class="text-base text-white">{{ user.login }}</span>
        <span class="text-xs text-gray-400 ml-auto">
          {{ formatLastActivity(user.last_activity) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";

interface User {
  id: number;
  login: string;
  last_activity: string | null;
  is_online: string;
}

const offlineUsers = ref<User[]>([]);
const loading = ref(false);

// Форматирование времени последней активности
const formatLastActivity = (lastActivityTime: string | null) => {
  if (!lastActivityTime) return "никогда не был активен";

  const lastActivity = new Date(lastActivityTime);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();

  // Разница в минутах
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  } else if (diffMinutes < 24 * 60) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} ч. назад`;
  } else {
    const days = Math.floor(diffMinutes / (24 * 60));
    return `${days} д. назад`;
  }
};

// Загрузка пользователей оффлайн
const loadOfflineUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/admin/getUsersWithStatus");
    const data = await response.json();

    if (data && data.status === "success") {
      // Фильтруем только оффлайн пользователей
      offlineUsers.value = (data.users || [])
        .filter((user: User) => user.is_online === "offline")
        .sort((a: User, b: User) => {
          // Сортируем по времени последней активности (от более недавних к более старым)
          if (!a.last_activity) return 1;
          if (!b.last_activity) return -1;
          return (
            new Date(b.last_activity).getTime() -
            new Date(a.last_activity).getTime()
          );
        });
    } else {
      console.error("Ошибка при загрузке пользователей оффлайн:", data);
    }
  } catch (error) {
    console.error("Ошибка при загрузке пользователей оффлайн:", error);
  } finally {
    loading.value = false;
  }
};

// Загружаем пользователей при монтировании компонента
onMounted(() => {
  loadOfflineUsers();

  // Обновляем список каждые 10 секунд для более точной статистики
  const interval = setInterval(loadOfflineUsers, 10000);

  // Очищаем интервал при размонтировании
  onUnmounted(() => clearInterval(interval));
});
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-color-error-500) #18181b;
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
