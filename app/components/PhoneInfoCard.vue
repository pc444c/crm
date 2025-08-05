<template>
  <div
    class="border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 rounded"
  >
    <!-- Информация о номере телефона -->
    <div class="relative">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-heroicons-phone" class="text-blue-500" />
        <span class="text-sm font-medium">{{ formattedPhone }}</span>
      </div>

      <div
        v-if="loading"
        class="flex items-center gap-2 text-sm text-gray-500 animate-pulse"
      >
        <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
        <span>Получение информации...</span>
      </div>

      <div v-else-if="error" class="text-sm text-red-500">
        {{ error }}
      </div>

      <div v-else-if="phoneInfo" class="space-y-1">
        <!-- Оператор и регион -->
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div
            v-if="phoneInfo && 'operator' in phoneInfo"
            class="flex items-center gap-1.5 text-gray-700"
          >
            <UIcon name="i-heroicons-signal" class="text-blue-500 w-4 h-4" />
            <span>{{ phoneInfo.operator as string }}</span>
          </div>

          <div
            v-if="phoneInfo && 'region' in phoneInfo"
            class="flex items-center gap-1.5 text-gray-700"
          >
            <UIcon name="i-heroicons-map-pin" class="text-red-500 w-4 h-4" />
            <span>{{ phoneInfo.region as string }}</span>
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div
          v-if="phoneInfo && 'timezone' in phoneInfo"
          class="text-xs text-gray-500 mt-1 flex"
        >
          <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 mr-1" />
          <span>
            Часовой пояс: {{ formatTimezone(phoneInfo.timezone as string) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  phoneNumber: {
    type: String,
    required: true,
  },
});

// Состояние
const loading = ref(false);
const error = ref("");
const phoneInfo = ref<Record<string, unknown> | null>(null);

// Форматирование номера телефона для отображения
const formattedPhone = computed(() => {
  if (!props.phoneNumber) return "";

  // Очистка номера от всего, кроме цифр
  const cleanNumber = props.phoneNumber.replace(/\D/g, "");

  // Российский формат: +7 (XXX) XXX-XX-XX
  if (
    cleanNumber.length === 11 &&
    (cleanNumber.startsWith("7") || cleanNumber.startsWith("8"))
  ) {
    const countryCode = "7";
    const areaCode = cleanNumber.substring(1, 4);
    const firstPart = cleanNumber.substring(4, 7);
    const secondPart = cleanNumber.substring(7, 9);
    const thirdPart = cleanNumber.substring(9, 11);

    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}-${thirdPart}`;
  }

  // Если формат не распознан, возвращаем как есть
  return props.phoneNumber;
});

// Форматирование временной зоны
const formatTimezone = (timezone: string): string => {
  if (!timezone) return "";

  // Если в формате "Europe/Moscow"
  if (timezone.includes("/")) {
    return timezone.split("/").pop() || timezone;
  }

  return timezone;
};

// Загрузка информации о телефоне
const loadPhoneInfo = async () => {
  if (!props.phoneNumber) return;

  loading.value = true;
  error.value = "";

  try {
    interface PhoneResponse {
      status: string;
      data?: Record<string, unknown>;
      message?: string;
    }

    const response = await $fetch<PhoneResponse>(
      `/api/user/check-phone?phone=${encodeURIComponent(props.phoneNumber)}`
    );

    if (response && typeof response === "object" && "status" in response) {
      if (response.status === "success" && response.data) {
        phoneInfo.value = response.data;
      } else {
        error.value = response.message || "Ошибка получения данных о номере";
      }
    }
  } catch (err) {
    console.error("Ошибка при проверке номера:", err);
    error.value = "Не удалось получить информацию о номере";
  } finally {
    loading.value = false;
  }
};

// Загрузка при изменении номера телефона
watch(
  () => props.phoneNumber,
  (newValue) => {
    if (newValue) {
      loadPhoneInfo();
    } else {
      phoneInfo.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.phone-info {
  border-width: 1px;
  border-radius: 0.5rem;
  padding: 0.75rem;
  position: relative;
}
</style>
