<template>
  <div class="min-w-full flex gap-6">
    <!-- Боковая навигация -->
    <div class="w-64 flex-shrink-0">
      <UCard class="sticky top-4">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-blue-500" />
            <h3 class="text-lg font-semibold">Детальная статистика</h3>
          </div>
        </template>

        <UVerticalNavigation :items="navigationItems" class="space-y-1" />
      </UCard>
    </div>

    <!-- Основное содержимое -->
    <div class="flex-1">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const route = useRoute();

const navigationItems = computed(() => [
  {
    label: "Общая статистика",
    icon: "i-heroicons-chart-pie",
    to: "/admin/statistics/overview",
    active: route.path === "/admin/statistics/overview",
  },
  {
    label: "Статистика по базам",
    icon: "i-heroicons-circle-stack",
    to: "/admin/statistics/databases",
    active: route.path === "/admin/statistics/databases",
  },
  {
    label: "Статистика по тегам",
    icon: "i-heroicons-tag",
    to: "/admin/statistics/tags",
    active: route.path === "/admin/statistics/tags",
  },
  {
    label: "Статистика по пользователям",
    icon: "i-heroicons-users",
    to: "/admin/statistics/users",
    active: route.path === "/admin/statistics/users",
  },
  {
    label: "Временная аналитика",
    icon: "i-heroicons-clock",
    to: "/admin/statistics/timeline",
    active: route.path === "/admin/statistics/timeline",
  },
]);

// Автоматический редирект на overview если находимся на базовой странице
if (route.path === "/admin/statistics" || route.path === "/admin/statistics/") {
  await navigateTo("/admin/statistics/overview");
}
</script>
