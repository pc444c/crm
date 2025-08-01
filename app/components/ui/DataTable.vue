<template>
  <div class="overflow-x-auto rounded-md shadow-md">
    <table class="min-w-full divide-y divide-gray-700">
      <thead class="bg-neutral-900">
        <tr>
          <th
            v-for="(column, idx) in columns"
            :key="idx"
            class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 z-10"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-700 bg-neutral-800">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-4 py-4 text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin h-5 w-5 mx-auto"
            />
          </td>
        </tr>
        <tr v-else-if="!items || items.length === 0">
          <td :colspan="columns.length" class="px-4 py-4 text-center">
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-for="(item, rowIdx) in items"
          :key="rowIdx"
          class="hover:bg-gray-800"
        >
          <td
            v-for="(column, colIdx) in columns"
            :key="colIdx"
            class="px-4 py-3 whitespace-nowrap"
          >
            <!-- Если для колонки определен слот, используем его -->
            <slot
              :name="`col-${column.key}`"
              :item="item"
              :value="item[column.key]"
              :row="rowIdx"
            >
              {{ item[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true,
    // Пример формата: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Название' }]
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: "Нет данных для отображения",
  },
});
</script>
