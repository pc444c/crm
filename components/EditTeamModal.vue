<template>
  <UModal v-model:open="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Переименовать команду
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="close"
          />
        </div>
      </template>

      <UForm :state="state" @submit="submit">
        <div class="space-y-4">
          <UFormGroup label="Название команды" name="name" required>
            <UInput
              v-model="state.name"
              placeholder="Введите новое название команды"
            />
          </UFormGroup>

          <UFormGroup label="Описание" name="description">
            <UTextarea
              v-model="state.description"
              placeholder="Описание команды (необязательно)"
              :rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="white" @click="close"> Отмена </UButton>
            <UButton type="submit" :loading="loading"> Сохранить </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  teamId: number;
  teamName: string;
  onSuccess: (newName: string) => void;
  onError: (message: string) => void;
}

const props = defineProps<Props>();

const isOpen = ref(true);
const loading = ref(false);

const state = reactive({
  name: props.teamName,
  description: "",
});

const close = () => {
  isOpen.value = false;
};

const submit = async () => {
  if (!state.name?.trim()) {
    props.onError("Название команды обязательно");
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch(`/api/admin/teams/${props.teamId}`, {
      method: "PUT",
      body: {
        name: state.name.trim(),
        description: state.description.trim() || undefined,
      },
    });

    if (response && response.status === "success") {
      props.onSuccess(state.name.trim());
      close();
    }
  } catch (error: unknown) {
    console.error("Ошибка при обновлении команды:", error);
    let errorMessage = "Не удалось обновить команду";

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
    // Небольшая задержка, чтобы анимация закрытия завершилась
    setTimeout(() => {
      // Закрываем модал через композабл useModal
      const modal = useModal();
      modal.close();
    }, 200);
  }
});
</script>
