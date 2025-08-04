<template>
  <div class="min-w-full flex flex-col gap-4">
    <u-card>
      <u-separator color="primary" size="xl" label="Базы данных" class="mb-4" />
      <div class="space-y-4">
        <!-- Загрузка файла -->
        <UInput type="file" @change="handleFileUpload" accept=".xlsx, .xls" />

        <!-- Сопоставление колонок -->
        <div v-if="rawColumns.length" class="space-y-2">
          <h3 class="font-semibold">Сопоставьте колонки:</h3>
          <div
            v-for="(col, index) in rawColumns"
            :key="index"
            class="flex gap-4 items-center"
          >
            <span class="w-48 font-mono">
              {{ col }}
              <span class="text-gray-400">({{ exampleValue(col) }})</span>
            </span>
            <select v-model="columnMap[col]" class="border bg-neutral-900 rounded-sm outline-none px-2 py-1">
              <option disabled value="">Выберите тип</option>
              <option
                v-for="option in availableOptions(col)"
                :key="option"
                :value="option"
              >
                {{ columnLabels[option] }}
              </option>
            </select>
            
          </div>
        </div>

        <!-- Результат -->
        <div v-if="convertedData.length" class="mt-6 border p-2 rounded border-primary-500">
          <h3 class="font-semibold mb-2">
            Результат (JSON)
            
          </h3>
          <p class="font-mono">Всего записей: {{ convertedData.length }}</p>
          <pre class="p-4 rounded text-sm overflow-auto max-h-96">{{
            JSON.stringify(convertedData, null, 2)
          }}</pre>
        </div>
        <div class="flex flex-row gap-8 items-center justify-between" v-show="convertedData.length">
            <UInput v-model="bdname" placeholder="Введите название бд" />
            <u-button color="primary" class="mt-2" icon="i-lucide-save" @click="LoadDB">
              Сохранить
            </u-button>
        </div>
      </div>
    </u-card>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from "xlsx";
import { ref, computed } from "vue";

const rawData = ref<any[]>([]); // данные из Excel
const rawColumns = ref<string[]>([]); // A, B, C...
const columnMap = ref<Record<string, string>>({}); // A => fio
const bdname = ref<string>(""); // Название базы данных
// Метки для селекта
const columnLabels: Record<string, string> = {
  fio: "ФИО",
  city: "Город",
  region: "Область",
  address: "Адрес",
  age: "Возраст",
  phone: "Телефон",
  timezone: "Часовой пояс",
  custom1: "Доп. поле 1",
  custom2: "Доп. поле 2",
  custom3: "Доп. поле 3",
  desc: "Доп. информация"
};

// Вывод примера значений по колонке
const exampleValue = (col: string) => {
  return rawData.value?.[0]?.[col] || "";
};

// Исключаем уже выбранные значения из других селектов
const availableOptions = (currentCol: string) => {
  const selected = Object.entries(columnMap.value)
    .filter(([key]) => key !== currentCol)
    .map(([, value]) => value);
  return Object.keys(columnLabels).filter((key) => !selected.includes(key));
};

// Преобразованные данные с правильными ключами
const convertedData = computed(() => {
  return rawData.value.map((row) => {
    const obj: Record<string, any> = {};
    for (const col of rawColumns.value) {
      const mappedKey = columnMap.value[col];
      if (mappedKey) {
        obj[mappedKey] = row[col];
      }
    }
    return obj;
  });
});

// Загрузка файла Excel
function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];

    // Используем A, B, C как заголовки
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: "A" }) as any[];

    rawData.value = rows;
    rawColumns.value = Object.keys(rows[0] || {});
    columnMap.value = {};
  };

  reader.readAsArrayBuffer(file);
}
const toast = useToast();
async function LoadDB() 
{
  if (!bdname.value) {
    toast.add({
      title: "Ошибка",
      description: "Введите название базы данных",
      color: "warning",
    });
    return;
  }

  const response = await $fetch("/api/loadnewdb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      dbname: bdname.value,
      dbdates: convertedData.value
    }
  });
  console.log(response);
  if (response) {
    alert("База данных успешно сохранена!");
  } else {
    alert("Ошибка при сохранении базы данных");
  }  
}
</script>
