<template>
  <div class="w-full h-full">
    <div v-if="!mounted" class="flex items-center justify-center h-full">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
    </div>
    <component
      v-else
      :is="VChart"
      :option="option"
      :autoresize="autoresize"
      :class="chartClass"
    />
  </div>
</template>

<script setup lang="ts">
interface ChartOption {
  [key: string]: unknown;
}

interface Props {
  option: ChartOption;
  autoresize?: boolean;
  chartClass?: string;
}

withDefaults(defineProps<Props>(), {
  autoresize: true,
  chartClass: 'w-full h-full'
});

const mounted = ref(false);
const VChart = ref();

onMounted(async () => {
  if (import.meta.client) {
    try {
      const { default: VChartComponent } = await import('vue-echarts');
      VChart.value = VChartComponent;
      mounted.value = true;
    } catch (error) {
      console.error('Failed to load VChart:', error);
    }
  }
});
</script>
