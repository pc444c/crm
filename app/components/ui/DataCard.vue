<template>
  <div class="bg-neutral-800 rounded-lg p-4 shadow-lg border border-neutral-700">
    <h2 class="text-lg font-semibold mb-4 text-primary-400">{{ title }}</h2>
    <div
      v-if="loading"
      class="flex justify-center items-center"
      :style="{ height: `${contentHeight}px` }"
    >
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
    </div>
    <div
      v-else-if="isEmpty"
      class="flex justify-center items-center"
      :style="{ height: `${contentHeight}px` }"
    >
      <p>{{ emptyText }}</p>
    </div>
    <div v-else :style="contentHeightStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isEmpty: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: "Нет данных для отображения",
  },
  contentHeight: {
    type: Number,
    default: 60,
  },
});

const contentHeightStyle = computed(() => {
  return props.contentHeight ? { height: `${props.contentHeight}px` } : {};
});
</script>
