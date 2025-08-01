<template>
  <div class="mb-6 bg-neutral-800 rounded-lg p-4">
    <h2 class="text-lg font-semibold mb-3">{{ title }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <UFormGroup :label="startDateLabel">
          <UInput
            v-model="startDateModel"
            type="date"
            placeholder="Выберите дату"
          />
        </UFormGroup>
      </div>
      <div>
        <UFormGroup :label="endDateLabel">
          <UInput
            v-model="endDateModel"
            type="date"
            placeholder="Выберите дату"
          />
        </UFormGroup>
      </div>
    </div>
    <div class="flex justify-end mt-2">
      <UButton
        color="primary"
        class="mr-2"
        :label="applyLabel"
        @click="applyFilter"
      />
      <UButton color="secondary" :label="resetLabel" @click="resetFilter" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Фильтр по дате",
  },
  startDateLabel: {
    type: String,
    default: "Начальная дата",
  },
  endDateLabel: {
    type: String,
    default: "Конечная дата",
  },
  applyLabel: {
    type: String,
    default: "Применить фильтр",
  },
  resetLabel: {
    type: String,
    default: "Сбросить",
  },
  startDate: {
    type: String,
    default: "",
  },
  endDate: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "apply",
  "reset",
]);

// Используем computed с геттером и сеттером для двусторонней привязки данных
const startDateModel = computed({
  get: () => props.startDate,
  set: (value) => emit("update:startDate", value),
});

const endDateModel = computed({
  get: () => props.endDate,
  set: (value) => emit("update:endDate", value),
});

function applyFilter() {
  emit("apply");
}

function resetFilter() {
  emit("update:startDate", "");
  emit("update:endDate", "");
  emit("reset");
}

// При монтировании компонента проверяем, не нужно ли установить значения по умолчанию
onMounted(() => {
  if (!props.startDate && !props.endDate) {
    // Можно добавить инициализацию по умолчанию, если нужно
    // Например, текущую дату
  }
});
</script>
