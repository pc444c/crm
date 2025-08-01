<template>
  <span class="inline-flex items-center">
    <span class="w-2 h-2 rounded-full mr-1" :class="statusClass" />
    <span>{{ label }}</span>
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
});

// Вычисляем класс на основе статуса
const statusClass = computed(() => {
  switch (props.status.toLowerCase()) {
    case "online":
      return "bg-green-500";
    case "offline":
      return "bg-red-500";
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
</script>
