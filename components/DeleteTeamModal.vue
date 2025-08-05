<template>
  <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-red-400">Удаление команды</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="close"
          />
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Вы действительно хотите удалить команду
          <strong>{{ teamName }}</strong
          >?
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Это действие необратимо. Все участники команды потеряют доступ к
          назначенным базам данных.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="white" @click="close"> Отмена </UButton>
          <UButton color="red" :loading="loading" @click="submit">
            Удалить команду
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  teamId: number;
  teamName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const props = defineProps<Props>();

const isOpen = ref(true);
const loading = ref(false);

const close = () => {
  isOpen.value = false;
};

const submit = async () => {
  loading.value = true;

  try {
    const response = await $fetch(`/api/admin/teams/${props.teamId}`, {
      method: "DELETE",
    });

    if (response && response.status === "success") {
      props.onSuccess();
      close();
    }
  } catch (error: unknown) {
    console.error("Ошибка при удалении команды:", error);
    let errorMessage = "Не удалось удалить команду";

    if (error && typeof error === "object" && "data" in error) {
      const errorData = error.data as Record<string, unknown>;
      if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    props.onError(errorMessage);
  } finally {
    loading.value = false;
  }
};

watch(isOpen, (value) => {
  if (!value) {
    setTimeout(() => {
      const modal = useModal();
      modal.close();
    }, 200);
  }
});
</script>
