<template>
  <div class="flex flex-col gap-4">
    <USeparator color="primary" label="Последние звонки за сегодня" />

    <div class="overflow-auto rounded-md">
      <table class="min-w-full text-sm text-left text-gray-400">
        <thead class="bg-neutral-900 text-gray-300 uppercase text-xs">
          <tr>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3">Номер телефона</th>
            <th class="px-4 py-3">Дата статуса</th>
            <th class="px-4 py-3">Дата взятия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-700 bg-neutral-800">
          <tr v-for="(call, idx) in calls" :key="idx" class="hover:bg-neutral-700">
            <td class="px-4 py-3 flex items-center gap-2">
              <UButton
                :icon="call.status.icon"
                size="xs"
                color="primary"
                variant="soft"
              />
              <span class="text-white">{{ call.status.label }}</span>
            </td>
            <td class="px-4 py-3 font-mono text-white">{{ call.phoneNumber }}</td>
            <td class="px-4 py-3 font-mono text-white">{{ formatDate(call.statusDate) }}</td>
            <td class="px-4 py-3 font-mono text-white">{{ formatDate(call.takenAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script lang="ts" setup>
function formatDate(dateStr: string) {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

const calls = Array.from({ length: 300 }, (_, i) => ({
  status: { label: "ПЕРЕЗВОН", icon: "material-symbols:call" },
  phoneNumber: `+7 999 123-45-${(67 + i).toString().padStart(2, "0")}`,
  statusDate: `2023-01-06T14:30:00`,
  takenAt: `2023-01-05T09:15:00`,
}));
</script>
