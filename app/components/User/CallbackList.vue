<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-phone" class="text-orange-500" />
          <span class="font-semibold">
            Перезвоны ({{ callbacks.length }})
          </span>
        </div>
        <div class="flex gap-2">
          <UToggle v-model="showAll" @change="loadCallbacks">
            <template #label>
              <span class="text-sm">Показать все</span>
            </template>
          </UToggle>
          <UButton
            icon="i-heroicons-arrow-path"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="loadCallbacks"
          />
        </div>
      </div>
    </template>

    <!-- Список перезвонов -->
    <div v-if="callbacks.length > 0" class="space-y-3 max-h-64 overflow-y-auto">
      <div
        v-for="callback in callbacks"
        :key="callback.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        :class="{
          'border-orange-300 bg-orange-50 dark:bg-orange-900/20': isUpcoming(
            callback.callback_time
          ),
          'border-red-300 bg-red-50 dark:bg-red-900/20': isOverdue(
            callback.callback_time
          ),
        }"
        @click="selectCallback(callback)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ callback.fio || "Не указано" }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {{ callback.phone || "Не указан" }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {{ formatDateTime(callback.callback_time) }}
            </div>
            <div
              v-if="callback.callback_comment"
              class="text-xs text-blue-600 dark:text-blue-400 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-300"
            >
              <span class="font-medium">Комментарий:</span>
              {{ callback.callback_comment }}
            </div>
            <div
              v-if="callback.description"
              class="text-xs text-gray-600 dark:text-gray-400 mt-1 italic"
            >
              {{ callback.description }}
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <div
              class="px-2 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200':
                  isUpcoming(callback.callback_time),
                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200':
                  isOverdue(callback.callback_time),
                'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200':
                  !isUpcoming(callback.callback_time) &&
                  !isOverdue(callback.callback_time),
              }"
            >
              {{ getTimeStatus(callback.callback_time) }}
            </div>
            <UIcon
              name="i-heroicons-arrow-right"
              class="text-gray-400 dark:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!loading" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-phone" class="mx-auto h-12 w-12 mb-4" />
      <p>{{ showAll ? "Нет перезвонов" : "Нет предстоящих перезвонов" }}</p>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { userApi } from "@/utils/api";

interface CallbackRecord {
  id: number;
  fio: string;
  phone: string;
  callback_time: string;
  callback_comment?: string;
  description?: string;
  city?: string;
  address?: string;
}

const emit = defineEmits<{
  selectCallback: [record: CallbackRecord];
}>();

// Реактивные данные
const loading = ref(false);
const callbacks = ref<CallbackRecord[]>([]);
const showAll = ref(false);

// Форматирование даты и времени
function formatDateTime(dateString: string): string {
  if (!dateString) return "Не указано";
  try {
    const date = new Date(dateString);
    const now = new Date();

    // Если сегодня
    if (date.toDateString() === now.toDateString()) {
      return `Сегодня в ${date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Если завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Завтра в ${date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Иначе полная дата
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Неверная дата";
  }
}

// Проверка, является ли перезвон предстоящим (в течение следующих 2 часов)
function isUpcoming(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return date >= now && date <= twoHoursFromNow;
}

// Проверка, является ли перезвон просроченным
function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();

  return date < now;
}

// Получение статуса времени
function getTimeStatus(dateString: string): string {
  if (isOverdue(dateString)) {
    return "Просрочен";
  } else if (isUpcoming(dateString)) {
    return "Скоро";
  } else {
    return "Запланирован";
  }
}

// Выбор перезвона
function selectCallback(callback: CallbackRecord) {
  emit("selectCallback", callback);
}

// Загрузка перезвонов
async function loadCallbacks() {
  loading.value = true;

  try {
    const response = await userApi(
      `/api/user/getCallbacks${showAll.value ? "?showAll=true" : ""}`
    );

    if (response.status === "success") {
      callbacks.value = response.data || [];
    } else {
      throw new Error(response.message || "Ошибка загрузки перезвонов");
    }
  } catch (error) {
    console.error("Ошибка при загрузке перезвонов:", error);
    const toast = useToast();
    toast.add({
      title: "Ошибка",
      description: "Не удалось загрузить перезвоны",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Загружаем перезвоны при монтировании
onMounted(() => {
  loadCallbacks();
});

// Обновляем перезвоны при изменениях в системе
if (import.meta.client) {
  window.addEventListener("call-list-updated", loadCallbacks);
}

// Очищаем слушатель при размонтировании
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener("call-list-updated", loadCallbacks);
  }
});
</script>
