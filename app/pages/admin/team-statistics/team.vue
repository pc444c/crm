<template>
  <div class="p-6 space-y-8">
    <!-- Фильтры и настройки -->
    <UCard>
      <template #header>Настройки статистики</template>
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Период с:
          </label>
          <input
            type="date"
            v-model="dateFrom"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Период до:
          </label>
          <input
            type="date"
            v-model="dateTo"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="applyDateFilter"
            :disabled="loading"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Загрузка...' : 'Применить' }}
          </button>
          <button
            @click="resetDateFilter"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Сбросить
          </button>
        </div>
      </div>
    </UCard>

    <!-- Общая итоговая статистика по тегам -->
    <UCard>
      <template #header>Итоговая статистика по тегам</template>
      <div v-if="loading" class="text-center py-6">Загрузка...</div>
      <div v-else-if="error" class="text-center py-6 text-red-600">Ошибка загрузки данных</div>
      <div v-else-if="totalTagStats.length === 0" class="text-center py-4 text-gray-500">
        Нет данных по тегам
      </div>
      <div v-else class="space-y-4">
        <!-- Сводка -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ totalTagStats.length }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Всего тегов</div>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatNumber(totalTagStats.reduce((sum, tag) => sum + tag.count, 0)) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Всего записей с тегами</div>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ Math.round(totalTagStats.reduce((sum, tag) => sum + tag.count, 0) / totalTagStats.length) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Среднее на тег</div>
          </div>
          <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-xl font-bold text-orange-600 dark:text-orange-400">{{ totalTagStats[0]?.count ? formatNumber(totalTagStats[0].count) : 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Самый популярный</div>
          </div>
        </div>

        <!-- Список всех тегов -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div v-for="tag in totalTagStats" :key="tag.tag" 
               class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full border border-gray-300" 
                   :style="{ backgroundColor: tag.color }"></div>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ tag.tag }}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatNumber(tag.count) }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ tag.teamCount }} команд</div>
            </div>
          </div>
        </div>

        <!-- График общих тегов -->
        <div class="mt-6">
          <h4 class="font-semibold mb-3 text-gray-900 dark:text-gray-100">Распределение по популярности</h4>
          <div class="h-64 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Bar
              :data="getTotalTagsChartData()"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Статистика по командам с полной разбивкой по тегам -->
    <UCard>
      <template #header>Статистика по командам</template>
      
      <div v-if="loading && !teams.length" class="text-center py-6">Загрузка...</div>
      <div v-else-if="error" class="text-center py-6 text-red-600">Ошибка загрузки данных</div>
      <div v-else-if="teamsWithData.length === 0" class="text-center py-4 text-gray-500">
        Нет данных по командам
      </div>
      <div v-else class="space-y-4">
        <div v-for="team in teamsWithData" :key="team.team_id" 
             class="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          
          <!-- Заголовок команды -->
          <div class="flex items-center justify-between gap-2 mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ team.team_name }}
            </h3>
            <div class="flex flex-wrap gap-3 text-sm">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                {{ formatNumber(team.member_count) }} участников
              </span>
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                {{ formatNumber(team.record_count) }} записей
              </span>
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-200">
                {{ formatNumber(team.used_count) }} использовано
              </span>
              <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">
                {{ team.tags?.length || 0 }} тегов
              </span>
            </div>
          </div>

          <!-- Теги команды -->
          <div v-if="team.tags && team.tags.length > 0" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div v-for="tag in team.tags" :key="tag.tag" 
                   class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full border border-gray-300" 
                       :style="{ backgroundColor: tag.color }"></div>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ tag.tag }}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatNumber(tag.count) }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
            Нет данных по тегам
          </div>
        </div>
      </div>
    </UCard>

    <!-- Теги по командам (детальные графики) -->
    <UCard v-if="Object.keys(tagsByTeam).length > 0">
      <template #header>Детальная статистика по тегам</template>
      
      <div class="space-y-6">
        <div v-for="(tags, teamId) in tagsByTeam" :key="teamId" class="space-y-3">
          <h3 class="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {{ getTeamName(teamId) }}
            <span class="text-sm text-gray-500 dark:text-gray-400 font-normal ml-2">
              ({{ tags.length }} {{ pluralize(tags.length, 'тег', 'тега', 'тегов') }})
            </span>
          </h3>
          
          <div class="h-64 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Bar
              :data="getChartData(tags)"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// Состояние
const stats = ref<Record<string, number>>({})
const teams = ref<Array<Record<string, any>>>([])
const tagsByTeam = ref<Record<string, { tag: string; count: number; color: string }[]>>({})
const loading = ref(false)
const error = ref(false)
const debugMode = ref(false) // Установите в true для отладки

// Переменные для фильтрации по датам
const dateFrom = ref('')
const dateTo = ref('')

// Лейблы для статистики
const labels: Record<string, string> = {
  totalRecords: 'Всего записей',
  usedRecords: 'Использованные записи',
  onlineUsers: 'Онлайн пользователей',
  totalUsers: 'Всего пользователей',
}

// Вычисляемое свойство для общей статистики по тегам
const totalTagStats = computed(() => {
  const tagMap = new Map<string, { count: number; color: string; teamCount: number }>()
  
  Object.values(tagsByTeam.value).forEach(teamTags => {
    teamTags.forEach(tag => {
      if (tagMap.has(tag.tag)) {
        const existing = tagMap.get(tag.tag)!
        existing.count += tag.count
        existing.teamCount += 1
      } else {
        tagMap.set(tag.tag, {
          count: tag.count,
          color: tag.color,
          teamCount: 1
        })
      }
    })
  })
  
  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      color: data.color,
      teamCount: data.teamCount
    }))
    .sort((a, b) => b.count - a.count)
})

// Вычисляемые свойства для оптимизации
const teamsWithData = computed(() => {
  return teams.value
    .filter(team => 
      // Показываем только команды с данными
      team.member_count > 0 || team.record_count > 0 || team.used_count > 0
    )
    .map(team => {
      const teamTags = tagsByTeam.value[team.team_id] || [];
      const validTags = teamTags.filter(tag => tag.count > 0);
      
      return {
        ...team,
        tags: validTags,
      };
    })
    .sort((a, b) => b.record_count - a.record_count); // Сортируем по количеству записей
});

function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseInt(num) || 0 : num || 0;
  return number.toLocaleString('ru-RU');
}

function pluralize(count: number, one: string, few: string, many: string): string {
  if (count % 10 === 1 && count % 100 !== 11) return one;
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return few;
  return many;
}

function getTeamName(teamId: string | number): string {
  const team = teams.value.find(t => t.team_id === Number(teamId));
  return team?.team_name || `Команда ${teamId}`;
}

// Данные для графика
function getChartData(tags: { tag: string; count: number; color: string }[]) {
  return {
    labels: tags.map(t => t.tag),
    datasets: [
      {
        label: 'Количество',
        data: tags.map(t => t.count),
        backgroundColor: tags.map(t => t.color || '#3B82F6'),
        borderColor: tags.map(t => t.color || '#3B82F6'),
        borderWidth: 1,
      },
    ],
  }
}

// График для общих тегов
function getTotalTagsChartData() {
  const topTags = totalTagStats.value.slice(0, 10); // Показываем топ-10
  return {
    labels: topTags.map(t => t.tag),
    datasets: [
      {
        label: 'Количество записей',
        data: topTags.map(t => t.count),
        backgroundColor: topTags.map(t => t.color || '#3B82F6'),
        borderColor: topTags.map(t => t.color || '#3B82F6'),
        borderWidth: 1,
      },
    ],
  }
}

// Функции для работы с датами
function applyDateFilter() {
  fetchStatistics();
}

function resetDateFilter() {
  dateFrom.value = '';
  dateTo.value = '';
  fetchStatistics();
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: false 
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.label}: ${formatNumber(context.raw)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return formatNumber(value);
        }
      }
    }
  }
}

// Нормализация данных
function normalizeData(data: any) {
  console.log('Normalizing data:', data);
  
  if (data.general) {
    Object.keys(data.general).forEach(key => {
      data.general[key] = Number(data.general[key]) || 0;
    });
  }
  
  if (Array.isArray(data.teams)) {
    data.teams = data.teams.map((team: any) => ({
      ...team,
      member_count: Number(team.member_count) || 0,
      record_count: Number(team.record_count) || 0,
      used_count: Number(team.used_count) || 0,
    }));
  }
  
  if (data.tagsByTeam) {
    Object.keys(data.tagsByTeam).forEach(teamId => {
      if (Array.isArray(data.tagsByTeam[teamId])) {
        data.tagsByTeam[teamId] = data.tagsByTeam[teamId].map((tag: any) => ({
          ...tag,
          count: Number(tag.count) || 0,
        }));
      }
    });
  }
  
  return data;
}

// Загрузка данных
async function fetchStatistics() {
  loading.value = true;
  error.value = false;
  
  try {
    console.log('Fetching statistics...');
    
    // Формируем URL с параметрами даты
    const params = new URLSearchParams();
    if (dateFrom.value) params.append('dateFrom', dateFrom.value);
    if (dateTo.value) params.append('dateTo', dateTo.value);
    
    const url = `/api/statistics${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const rawData = await res.json();
    console.log('Raw API response:', rawData);
    
    const data = normalizeData(rawData);
    console.log('Normalized data:', data);

    stats.value = data.general || {};
    teams.value = data.teams || [];
    tagsByTeam.value = data.tagsByTeam || {};
    
    console.log('Updated state:', {
      stats: stats.value,
      teams: teams.value.length,
      tagsByTeam: Object.keys(tagsByTeam.value).length
    });
    
  } catch (e) {
    console.error('Ошибка загрузки статистики:', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// Загружаем данные при монтировании
fetchStatistics();
</script>