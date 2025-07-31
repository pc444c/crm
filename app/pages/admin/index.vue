<template>
  <div class="min-w-full flex flex-col gap-4">
    <section class="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <USeparator
        color="primary"
        label="Статистика холодки"
        class="col-span-1 md:col-span-3 mb-4"
      />
      <admin-stat-user-all class="w-full" />
      <admin-stat-user-offline class="w-full" />
      <admin-stat-user-online class="w-full" />
    </section>
    <section class="mb-16">
         <USeparator
        color="primary"
        label="Статистика по звонкам"
        class="col-span-1 md:col-span-3 mb-4"
      />
      <BarChart
        :key="colorMode.value"
        :data="RevenueData"
        :height="300"
        :categories="RevenueCategories"
        :y-axis="['desktop']"
        :x-num-ticks="6"
        :radius="4"
        :y-grid-line="true"
        :x-formatter="xFormatter"
        :legend-position="LegendPosition.Top"
        :hide-legend="false"
      />
    </section>
    <NuxtLink
      to="/admin/apitd"
      class="text-blue-500 hover:underline mb-4"
      >LINK LINK LINK</NuxtLink>
  </div>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();

const RevenueData = [
  { month: "НДЗ", desktop: 300 },
  { month: "СЛИВ", desktop: 250 },
  { month: "ПУСТОЙ", desktop: 530 },
  { month: "МРАЗЬ", desktop: 124 },
  { month: "НИЩИЙ", desktop: 800 },
  { month: "ПЕРЕЗВОН", desktop: 2450 },
  { month: "ПЕРЕДАТЬ", desktop: 5200 },
];

const RevenueCategories = computed(() => ({
  desktop: {
    name: "Количество звонков со статусом",
    color: "#22c55e",
  },
}));

const xFormatter = (i: number): string => `${RevenueData[i]?.month}`;

</script>

<style lang="scss" scoped></style>
