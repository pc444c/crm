<template>
  <div class="flex flex-col gap-4">
    <USeparator color="primary" label="Выберите тег для записи" />

    <div v-if="loading" class="text-center py-4">
      <div class="flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
      </div>
    </div>

    <div v-else-if="error" class="text-center text-red-500">
      {{ error }}
    </div>

    <div v-else-if="tags.length === 0" class="text-center text-gray-500">
      Нет доступных тегов
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <UChip
        v-for="tag in tags"
        :key="tag.id"
        :color="tag.color"
        :text-color="getContrastColor(tag.color)"
        :class="{ 'opacity-75': selectedTag !== tag.id }"
        variant="solid"
        class="cursor-pointer p-2 text-sm"
        @click="selectTag(tag.id)"
      >
        {{ tag.name }}
        <template #trailing>
          <UIcon
            v-if="selectedTag === tag.id"
            name="i-heroicons-check"
            class="ml-1"
          />
        </template>
      </UChip>
    </div>

    <div class="flex justify-end">
      <UButton
        color="primary"
        :loading="submitting"
        :disabled="!selectedTag || submitting"
        @click="submitTag"
      >
        Назначить тег
      </UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  recordId: {
    type: Number,
    required: true,
  },
  currentTag: {
    type: String,
    default: null,
  },
  currentTagId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["tag-assigned"]);

const tags = ref([]);
const loading = ref(true);
const submitting = ref(false);
const error = ref(null);
const selectedTag = ref(null);

// Вычисляем контрастный цвет для текста (белый или черный)
function getContrastColor(bgColor) {
  if (!bgColor) return "white";

  // Простой алгоритм для определения контрастного цвета
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "black" : "white";
}

// Загрузка списка тегов
async function fetchTags() {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await useFetch("/api/admin/listtags");
    tags.value = data.value || [];

    // Если у записи уже есть тег ID, используем его
    if (props.currentTagId) {
      selectedTag.value = props.currentTagId;
    }
    // Иначе пробуем найти тег по имени
    else if (props.currentTag) {
      const currentTagObj = tags.value.find(
        (tag) => tag.name === props.currentTag
      );
      if (currentTagObj) {
        selectedTag.value = currentTagObj.id;
      }
    }
  } catch (e) {
    console.error("Ошибка при загрузке тегов:", e);
    error.value = "Не удалось загрузить теги";
  } finally {
    loading.value = false;
  }
}

// Выбор тега
function selectTag(tagId) {
  selectedTag.value = tagId;
}

// Назначение тега
async function submitTag() {
  if (!props.recordId || !selectedTag.value) return;

  submitting.value = true;

  try {
    const { data } = await useFetch("/api/records/setTag", {
      method: "POST",
      body: {
        recordId: props.recordId,
        tagId: selectedTag.value,
      },
    });

    if (data.value && data.value.status === "success") {
      // Находим информацию о выбранном теге
      const selectedTagInfo = tags.value.find(
        (t) => t.id === selectedTag.value
      );

      // Уведомляем родителя об успешном назначении тега
      emit("tag-assigned", {
        recordId: props.recordId,
        tagId: selectedTag.value,
        tagName: selectedTagInfo?.name || "",
        tagInfo: selectedTagInfo
          ? {
              id: selectedTagInfo.id,
              name: selectedTagInfo.name,
              color: selectedTagInfo.color,
            }
          : null,
      });

      useToast().add({
        title: "Успех",
        description: "Тег успешно назначен",
        color: "success",
      });
    } else {
      error.value = data.value?.message || "Ошибка при назначении тега";
      useToast().add({
        title: "Ошибка",
        description: error.value,
        color: "error",
      });
    }
  } catch (e) {
    console.error("Ошибка при назначении тега:", e);
    error.value = "Не удалось назначить тег";
    useToast().add({
      title: "Ошибка",
      description: error.value,
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

// Инициализация
onMounted(() => {
  fetchTags();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
