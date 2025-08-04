<template>
  <span class="inline-flex items-center">
    <span class="w-2 h-2 rounded-full mr-1" :class="statusClass" />
    <span>{{ displayLabel }}</span>
    <span
      v-if="count !== undefined"
      class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded"
    >
      {{ count }}
    </span>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
    // Возможные значения: 'online', 'offline', 'pending', 'success', 'error', 'warning', или любой другой
  },
  label: {
    type: String,
    default: "",
  },
  count: {
    type: Number,
    default: undefined,
  },
});

// Вычисляем класс на основе статуса
const statusClass = computed(() => {
  switch (props.status.toLowerCase()) {
    case "online":
      return "bg-green-500";
    case "offline":
      return "bg-red-500";
    case "busy":
      return "bg-yellow-500";
    case "pending":
      return "bg-yellow-500 animate-pulse";
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
});

// Вычисляем лейбл
const displayLabel = computed(() => {
  if (props.label) return props.label;

  switch (props.status.toLowerCase()) {
    case "online":
      return "Онлайн";
    case "offline":
      return "Оффлайн";
    case "busy":
      return "Занят";
    case "pending":
      return "Ожидание";
    case "success":
      return "Успех";
    case "error":
      return "Ошибка";
    case "warning":
      return "Предупреждение";
    default:
      return props.status;
  }
});
</script>
