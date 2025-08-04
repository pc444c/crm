<template>
  <UCard class="p-4 bg-neutral-900 min-w-full h-full">
    <div class="flex justify-between items-center mb-3">
      <USeparator
        color="primary"
        label="Все онлайн холодники"
        class="flex-grow"
      />
      <UButton
        icon="i-heroicons-arrow-path"
        size="xs"
        color="primary"
        variant="ghost"
        class="ml-2"
        :loading="loading"
        @click="loadOnlineUsers"
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
          class="text-primary-500 w-6 h-6 animate-spin"
        />
      </div>

      <div
        v-if="onlineUsers.length === 0 && !loading"
        class="text-center py-4 text-gray-400"
      >
        Нет пользователей онлайн
      </div>
      <div
        v-for="(user, index) in onlineUsers"
        :key="user.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-900 transition"
      >
        <div
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-primary-700 text-white text-base"
        >
          {{ index + 1 }}
        </div>
        <span class="text-base text-white">{{ user.login }}</span>
        <span class="text-xs text-green-400 ml-auto">онлайн</span>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

interface User {
  id: number;
  login: string;
  last_activity: string;
  is_online: string;
}

const onlineUsers = ref<User[]>([]);
const loading = ref(false);

// Загрузка пользователей онлайн
const loadOnlineUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/admin/getOnlineUsers");
    const data = await response.json();

    if (data && data.status === "success") {
      // Сортируем пользователей по времени последней активности (самые свежие вверху)
      onlineUsers.value = (data.users || []).sort((a: User, b: User) => {
        if (!a.last_activity) return 1;
        if (!b.last_activity) return -1;
        return (
          new Date(b.last_activity).getTime() -
          new Date(a.last_activity).getTime()
        );
      });
    } else {
      console.error("Ошибка при загрузке пользователей онлайн:", data);
    }
  } catch (error) {
    console.error("Ошибка при загрузке пользователей онлайн:", error);
  } finally {
    loading.value = false;
  }
};

// Загружаем пользователей при монтировании компонента
onMounted(() => {
  loadOnlineUsers();

  // Обновляем список каждые 10 секунд для максимальной актуальности
  const interval = setInterval(loadOnlineUsers, 10000);

  // Очищаем интервал при размонтировании
  onUnmounted(() => clearInterval(interval));
});
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #22c55e #18181b; /* thumb color (green), track color */
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

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4ade80;
}
</style>
