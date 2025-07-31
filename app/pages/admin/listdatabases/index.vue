<template>
  <div class="min-w-full flex flex-col gap-4">
    <u-card>
      <u-separator color="primary"  label="Базы данных" class="mb-4" />
      <div class="overflow-x-auto">
        <table
          class="min-w-full border-separate border-primary-500 font-mono rounded-lg shadow"
        >
          <thead>
            <tr>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                ID
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Название
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Кол-во записей
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Дата
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-primary-700 border-b"
              >
                Удалить
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginatedData"
              :key="row.id"
              class="border-b border-primary-500"
            >
              <td class="px-4 py-2">{{ row.id }}</td>
              <td class="px-4 py-2">{{ row.name }}</td>
              <td class="px-4 py-2">{{ row.recordsCount }}</td>
              <td class="px-4 py-2">{{ formatDate(row.created_at) }}</td>
              <td class="px-4 py-2">
                <UModal v-model:open="isOpen" title="Ты точно хочешь уволить?">
                  <UButton color="error" icon="line-md:trash">Удалить</UButton>
                  <template #body>
                    <Placeholder class="h-48" />
                    <div class="flex flex-col gap-2">
                      <span>
                        Вы уверены, что хотите удалить базу данных?
                        <strong>{{ row.name }}</strong
                        >? Это действие нельзя отменить.
                      </span>
                      <div class="flex flex-row gap-4">
                        <UButton
                          color="error"
                          size="md"
                          class="mt-4 max-w-max"
                          icon="i-lucide-check"
                          @click="deletedb(row.id)"
                          >Да, удалить</UButton
                        >
                        <UButton
                          color="secondary"
                          size="md"
                          class="mt-4 max-w-max"
                          icon="i-lucide-x"
                          close
                          @click="isOpen = false"
                          >Нет, отменить</UButton
                        >
                      </div>
                    </div>
                  </template>
                </UModal>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td colspan="5" class="text-center py-4 text-gray-400">
                Нет данных
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end mt-4 gap-2">
        <UButton :disabled="page === 1" @click="page--" size="sm"
          >Назад</UButton
        >
        <UButton :disabled="page === totalPages" @click="page++" size="sm"
          >Вперёд</UButton
        >
      </div>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
const isOpen = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = 5;
interface Database {
  id: number;
  name: string;
  created_at: string; // ISO дата в строке
  recordsCount: number;
}
const toast = useToast();
const databases = ref<Database[]>([]);
const deletedb = async (id: number) => {
    try {
        const res = await $fetch(`/api/deletedb`, {
            method: "POST",
            body: { dbId:id },
        });
        LoadDBInfo();
        if (res) {
            toast.add({
                title: res.message,
                color: "secondary",
            });
        }
    } catch (error) {
        console.error("Ошибка при удалении базы данных:", error);
    } finally {
        isOpen.value = false;
    }
};

const filteredData = computed(() =>
  databases.value.filter((row) =>
    row.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / pageSize))
);

const paginatedData = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredData.value.slice(start, start + pageSize);
});

watch([search, filteredData], () => {
  page.value = 1;
});

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function LoadDBInfo() {
  try {
    const response = await $fetch("/api/basesinfo");
    console.log("Данные успешно загружены:", response);
    databases.value.splice(0, databases.value.length, ...response.databases);

    console.log("Базы данных:", databases);
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  }
}
onMounted(() => {
  LoadDBInfo();
});
</script>

<style lang="scss" scoped></style>
