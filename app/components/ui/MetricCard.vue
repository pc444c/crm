<template>
  <UCard class="relative overflow-hidden">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ title }}
        </p>
        <div v-if="loading" class="mt-2">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <p
          v-else
          class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2"
        >
          {{ formattedValue }}
        </p>
      </div>
      <div class="flex-shrink-0 p-3 rounded-full" :class="iconBgClass">
        <UIcon :name="icon" class="w-6 h-6" :class="iconClass" />
      </div>
    </div>

    <!-- Дополнительная информация -->
    <div
      v-if="$slots.default"
      class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <slot />
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  icon: string;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: "blue",
  loading: false,
});

const formattedValue = computed(() => {
  if (typeof props.value === "number") {
    return props.value.toLocaleString("ru-RU");
  }
  return props.value;
});

const iconBgClass = computed(() => {
  const colorMap = {
    blue: "bg-blue-100 dark:bg-blue-900",
    green: "bg-green-100 dark:bg-green-900",
    purple: "bg-purple-100 dark:bg-purple-900",
    orange: "bg-orange-100 dark:bg-orange-900",
    red: "bg-red-100 dark:bg-red-900",
    gray: "bg-gray-100 dark:bg-gray-900",
  };
  return colorMap[props.color];
});

const iconClass = computed(() => {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-600 dark:text-gray-400",
  };
  return colorMap[props.color];
});
</script>
