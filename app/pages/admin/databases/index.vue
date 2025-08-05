<template>
  <div class="min-w-full flex flex-col gap-4">
    <u-card>
      <u-separator color="primary" size="xl" label="Базы данных" class="mb-4" />
      <div class="space-y-4">
        <!-- Загрузка файла -->
        <UInput type="file" accept=".xlsx, .xls" @change="handleFileUpload" />

        <!-- Подсказка для пользователя -->
        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div class="flex items-start gap-3">
            <Icon
              name="i-lucide-lightbulb"
              class="w-5 h-5 text-blue-600 mt-0.5"
            />
            <div>
              <h4 class="font-medium text-blue-800 dark:text-blue-200">
                Умная автоподстановка
              </h4>
              <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Система автоматически определит тип данных по содержимому
                колонок:
                <strong>телефоны</strong> (79999999999),
                <strong>ФИО</strong> (Иван Петров),
                <strong>города</strong> (Москва), <strong>возраст</strong> (25)
                и другие типы данных.
              </p>
            </div>
          </div>
        </div>

        <!-- Сопоставление колонок -->
        <div v-if="rawColumns.length" class="space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Сопоставьте колонки:</h3>
              <p class="text-sm text-gray-600">
                Сопоставлено:
                {{ Object.values(columnMap).filter(Boolean).length }} из
                {{ rawColumns.length }}
              </p>
            </div>
            <div class="flex gap-2">
              <u-button
                color="primary"
                variant="soft"
                size="sm"
                @click="autoMapColumns"
              >
                <Icon name="i-lucide-brain" class="w-4 h-4 mr-2" />
                Умная подстановка
              </u-button>
              <u-button
                color="neutral"
                variant="soft"
                size="sm"
                @click="clearMapping"
              >
                <Icon name="i-lucide-x" class="w-4 h-4 mr-2" />
                Очистить
              </u-button>
            </div>
          </div>
          <div
            v-for="(col, index) in rawColumns"
            :key="index"
            class="flex gap-4 items-center"
          >
            <span class="w-48 font-mono">
              {{ col }}
              <span class="text-gray-400">({{ exampleValue(col) }})</span>
              <!-- Индикатор способа определения -->
              <span v-if="columnMap[col]" class="ml-2 text-xs">
                <span
                  v-if="getMappingMethod(col) === 'auto'"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  title="Определено автоматически по содержимому"
                >
                  <Icon name="i-lucide-brain" class="w-3 h-3 mr-1" />
                  Авто
                </span>
                <span
                  v-else-if="getMappingMethod(col) === 'manual'"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  title="Определено по названию"
                >
                  <Icon name="i-lucide-tag" class="w-3 h-3 mr-1" />
                  Имя
                </span>
              </span>
              <span v-else-if="columnMap[col] === ''" class="ml-2 text-xs">
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                  title="Колонка не используется"
                >
                  <Icon name="i-lucide-minus" class="w-3 h-3 mr-1" />
                  Не используется
                </span>
              </span>
            </span>
            <select
              v-model="columnMap[col]"
              class="border bg-neutral-900 rounded-sm outline-none px-2 py-1"
            >
              <option value="">Не использовать</option>
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
        <div
          v-if="convertedData.length"
          class="mt-6 border p-2 rounded border-primary-500"
        >
          <h3 class="font-semibold mb-2">Результат (JSON)</h3>
          <p class="font-mono">Всего записей: {{ convertedData.length }}</p>
          <pre class="p-4 rounded text-sm overflow-auto max-h-96">{{
            JSON.stringify(convertedData, null, 2)
          }}</pre>
        </div>
        <div
          v-show="convertedData.length"
          class="flex flex-row gap-8 items-center justify-between"
        >
          <UInput v-model="bdname" placeholder="Введите название бд" />
          <u-button
            color="primary"
            class="mt-2"
            icon="i-lucide-save"
            @click="LoadDB"
          >
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

const rawData = ref<Record<string, string | number | null>[]>([]); // данные из Excel
const rawColumns = ref<string[]>([]); // A, B, C...
const columnMap = ref<Record<string, string>>({}); // A => fio
const bdname = ref<string>(""); // Название базы данных
// Метки для селекта
const columnLabels: Record<string, string> = {
  title: "Название/Заголовок",
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
  desc: "Доп. информация",
};

// Вывод примера значений по колонке
const exampleValue = (col: string) => {
  return rawData.value?.[0]?.[col] || "";
};

// Исключаем уже выбранные значения из других селектов
const availableOptions = (currentCol: string) => {
  const selected = Object.entries(columnMap.value)
    .filter(([key]) => key !== currentCol)
    .map(([, value]) => value)
    .filter((value) => value !== ""); // Исключаем пустые значения из фильтрации
  return Object.keys(columnLabels).filter((key) => !selected.includes(key));
};

// Преобразованные данные с правильными ключами
const convertedData = computed(() => {
  return rawData.value.map((row) => {
    const obj: Record<string, string | number | null> = {};
    for (const col of rawColumns.value) {
      const mappedKey = columnMap.value[col];
      if (mappedKey) {
        obj[mappedKey] = row[col] ?? null;
      }
    }
    return obj;
  });
});

// Интеллектуальное определение типа данных по содержимому
const detectDataType = (col: string): string | null => {
  const values = rawData.value
    .map((row) => row[col])
    .filter((val) => val != null && val !== "")
    .slice(0, 10); // Анализируем первые 10 значений

  if (values.length === 0) return null;

  const stringValues = values.map((val) => String(val).trim());

  // Проверяем на телефонные номера
  const phonePattern = /^[+]?[7-8]?[\s-()]*[\d\s-()]{7,15}$/;
  const phoneCount = stringValues.filter((val) =>
    phonePattern.test(val)
  ).length;
  if (phoneCount / values.length >= 0.7) return "phone";

  // Проверяем на возраст (числа от 0 до 120)
  const agePattern = /^\d{1,3}$/;
  const ageValues = stringValues.filter((val) => agePattern.test(val));
  const validAges = ageValues.filter((val) => {
    const num = parseInt(val);
    return num >= 0 && num <= 120;
  });
  if (validAges.length / values.length >= 0.8) return "age";

  // Проверяем на города (начинается с заглавной буквы, содержит буквы)
  const cityPattern = /^[А-ЯЁA-Z][а-яёa-z\s-]{2,}$/;
  const cityCount = stringValues.filter((val) => cityPattern.test(val)).length;
  if (cityCount / values.length >= 0.6) return "city";

  // Проверяем на ФИО (2-3 слова, каждое с заглавной буквы)
  const fioPattern =
    /^[А-ЯЁA-Z][а-яёa-z]+\s+[А-ЯЁA-Z][а-яёa-z]+(\s+[А-ЯЁA-Z][а-яёa-z]+)?$/;
  const fioCount = stringValues.filter((val) => fioPattern.test(val)).length;
  if (fioCount / values.length >= 0.7) return "fio";

  // Проверяем на адреса (содержит ключевые слова)
  const addressKeywords = [
    "ул",
    "улица",
    "пр",
    "проспект",
    "д",
    "дом",
    "кв",
    "квартира",
    "street",
    "ave",
  ];
  const addressCount = stringValues.filter((val) =>
    addressKeywords.some((keyword) => val.toLowerCase().includes(keyword))
  ).length;
  if (addressCount / values.length >= 0.5) return "address";

  // Проверяем на регионы (области, края, республики)
  const regionKeywords = [
    "область",
    "край",
    "республика",
    "регион",
    "обл",
    "респ",
  ];
  const regionCount = stringValues.filter((val) =>
    regionKeywords.some((keyword) => val.toLowerCase().includes(keyword))
  ).length;
  if (regionCount / values.length >= 0.5) return "region";

  return null;
};

// Автоматическое сопоставление полей
const autoMapColumns = () => {
  const mappings: Record<string, string[]> = {
    title: [
      "title",
      "название",
      "заголовок",
      "тема",
      "subject",
      "name",
      "имя",
      "наименование",
    ],
    fio: [
      "fio",
      "фио",
      "fullname",
      "полное имя",
      "ф.и.о",
      "full_name",
      "person",
      "персона",
    ],
    phone: [
      "phone",
      "телефон",
      "номер",
      "number",
      "тел",
      "мобильный",
      "mobile",
      "tel",
      "telephone",
    ],
    city: ["city", "город", "населенный пункт", "нас_пункт", "settlement"],
    region: ["region", "область", "регион", "субъект", "край", "республика"],
    address: ["address", "адрес", "location", "место", "проживание"],
    age: ["age", "возраст", "лет", "years", "года"],
    timezone: ["timezone", "часовой пояс", "время", "time", "зона"],
    custom1: ["custom1", "доп1", "дополнительно1", "поле1", "field1"],
    custom2: ["custom2", "доп2", "дополнительно2", "поле2", "field2"],
    custom3: ["custom3", "доп3", "дополнительно3", "поле3", "field3"],
    desc: [
      "desc",
      "description",
      "описание",
      "комментарий",
      "примечание",
      "note",
      "info",
    ],
  };

  // Очищаем предыдущее сопоставление
  columnMap.value = {};

  let autoDetected = 0;
  let nameMatched = 0;

  for (const col of rawColumns.value) {
    let fieldAssigned = false;

    // 1. Сначала пробуем интеллектуальное определение по содержимому
    const detectedType = detectDataType(col);
    if (
      detectedType &&
      !Object.values(columnMap.value)
        .filter((v) => v !== "")
        .includes(detectedType)
    ) {
      columnMap.value[col] = detectedType;
      autoDetected++;
      fieldAssigned = true;
    }

    // 2. Если не определилось по содержимому, пробуем по названию колонки
    if (!fieldAssigned) {
      const lowerCol = col.toLowerCase().trim();

      // Ищем точное совпадение сначала
      for (const [field, keywords] of Object.entries(mappings)) {
        if (
          !Object.values(columnMap.value)
            .filter((v) => v !== "")
            .includes(field) &&
          keywords.some((keyword) => lowerCol === keyword.toLowerCase())
        ) {
          columnMap.value[col] = field;
          nameMatched++;
          fieldAssigned = true;
          break;
        }
      }

      // Если точного совпадения нет, ищем частичное
      if (!fieldAssigned) {
        for (const [field, keywords] of Object.entries(mappings)) {
          if (
            !Object.values(columnMap.value)
              .filter((v) => v !== "")
              .includes(field) &&
            keywords.some((keyword) => lowerCol.includes(keyword.toLowerCase()))
          ) {
            columnMap.value[col] = field;
            nameMatched++;
            break;
          }
        }
      }
    }
  }

  // Показываем результат автоподстановки
  const totalMapped = Object.values(columnMap.value).filter(Boolean).length;
  toast.add({
    title: "Умная автоподстановка завершена",
    description: `Сопоставлено ${totalMapped} из ${rawColumns.value.length} колонок. 
                  По содержимому: ${autoDetected}, по названию: ${nameMatched}`,
    color: totalMapped > 0 ? "success" : "warning",
  });
};

// Функция для определения способа сопоставления
const getMappingMethod = (col: string): string => {
  if (!columnMap.value[col]) return "";

  // Проверяем, было ли это определено по содержимому
  const detectedType = detectDataType(col);
  if (detectedType === columnMap.value[col]) {
    return "auto"; // Определено автоматически по содержимому
  }

  return "manual"; // Определено по названию или вручную
};

// Очистка сопоставления
const clearMapping = () => {
  columnMap.value = {};
  toast.add({
    title: "Сопоставление очищено",
    description: "Все сопоставления колонок сброшены",
    color: "info",
  });
};

// Загрузка файла Excel
function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error("Файл не содержит листов");
      }
      const worksheet = workbook.Sheets[firstSheet];
      if (!worksheet) {
        throw new Error("Не удалось прочитать данные из файла");
      }

      // Используем A, B, C как заголовки
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: "A",
      }) as Record<string, string | number | null>[];

      rawData.value = rows;
      rawColumns.value = Object.keys(rows[0] || {});
      columnMap.value = {};

      // Автоматическое сопоставление после загрузки
      autoMapColumns();
    } catch (error) {
      console.error("Ошибка при обработке файла:", error);
      toast.add({
        title: "Ошибка",
        description: "Не удалось обработать файл. Проверьте формат файла.",
        color: "error",
      });
    }
  };

  reader.readAsArrayBuffer(file);
}
const toast = useToast();
async function LoadDB() {
  if (!bdname.value) {
    toast.add({
      title: "Ошибка",
      description: "Введите название базы данных",
      color: "warning",
    });
    return;
  }

  try {
    const response = await $fetch("/api/loadnewdb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        dbname: bdname.value,
        dbdates: convertedData.value,
      },
    });

    console.log(response);

    if (response.status === "success") {
      // Показываем детальную статистику
      const stats = response.statistics;
      let description = response.message;

      if (stats && stats.duplicates > 0) {
        description += `\n📊 Всего записей: ${stats.total}, загружено: ${stats.inserted}, дубликатов пропущено: ${stats.duplicates}`;
      }

      toast.add({
        title: "Успех",
        description: description,
        color: "success",
      });

      // Очистка формы после успешного сохранения
      rawData.value = [];
      rawColumns.value = [];
      columnMap.value = {};
      bdname.value = "";
    } else if (response.status === "error") {
      // Обрабатываем случай когда все записи дубликаты
      const stats = response.statistics;
      let description = response.message;

      if (stats && stats.duplicates > 0) {
        description += `\n📊 Всего записей: ${stats.total}, дубликатов: ${stats.duplicates}`;
      }

      toast.add({
        title: "Внимание",
        description: description,
        color: "warning",
      });
    } else {
      throw new Error(response.message || "Неизвестная ошибка");
    }
  } catch (error) {
    console.error("Ошибка при сохранении базы данных:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ошибка при сохранении базы данных";
    toast.add({
      title: "Ошибка",
      description: errorMessage,
      color: "error",
    });
  }
}
</script>
