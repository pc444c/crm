<template>
  <header
    class="bg-neutral-800 p-2 flex flex-row gap-6 items-center justify-between"
  >
    <div class="flex flex-row gap-6 items-center">
      <NuxtImg
        src="/logocrm.png"
        alt="Logo"
        width="50"
        height="50"
        class="rounded-full"
      />
      <h2 class="font-bold font-mono text-xl">CRM</h2>
    </div>
    <div>
      <UNavigationMenu color="primary" :items="items" class="w-full" />
    </div>
    <BtnLogout />
  </header>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Статистика",
      icon: "i-lucide-bar-chart-3",
      to: "/admin",
    },
    {
      label: "Базы данных",
      icon: "i-lucide-database",
      // указываем вручную когда активен
      children: [
        {
          label: "Загрузить базу",
          description: "Загрузить базу данных из Excel",
          icon: "i-lucide-upload",
          to: "/admin/databases",
        },
        {
          label: "Список баз",
          description: "Просмотр и управление базами данных",
          icon: "i-lucide-list",
          to: "/admin/listdatabases",
        },
      ],
    },
    {
      label: "Пользователи",
      icon: "i-lucide-users",
      to: "/admin/users",
    },
    {
      label: "Настройки",
      icon: "lucide:settings",
      children: [
        {
          label: "Управление тегами",
          icon: "lucide:bookmark",
          description: "Тут можно удалить,изменить редактировать теги",
          to: "/admin/set_tags",
        },
        {
          label: "Глобальные скрипты",
          icon: "i-heroicons-globe-alt",
          description: "Создание скриптов для всех пользователей",
          to: "/admin/scripts",
        },
        {
          label: "Шаблоны комментариев",
          icon: "i-heroicons-chat-bubble-left-right",
          description: "Управление шаблонами комментариев",
          to: "/admin/comment-templates",
        },
      ],
    },
    // {
    //   label: 'Документы',
    //   icon: 'i-lucide-file-text',
    //   to: '/layouts',
    // }
  ],
]);
// Nuxt UI components are auto-imported in Nuxt 3
</script>

<style scoped>
/* Дополнительные стили можно добавить здесь */
</style>
