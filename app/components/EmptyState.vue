<template>
  <div class="flex flex-col items-center justify-center h-80 text-center">
    <UIcon
      :name="icon"
      class="text-6xl text-gray-400 dark:text-gray-600 mb-4"
    />
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      {{ title }}
    </h3>
    <p class="text-gray-500 dark:text-gray-400 max-w-sm">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  icon: "i-heroicons-inbox",
  title: "Нет данных",
  description: "Данные для отображения отсутствуют",
});
</script>
