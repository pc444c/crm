<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 p-6"
  >
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Заголовок и фильтры -->
      <div
        class="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8"
      >
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-4">
            <div
              class="p-3 flex justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl"
            >
              <Icon name="i-mdi-chart-box" class="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Аналитика команд
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                Детальная статистика и метрики производительности
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <UBadge
              v-if="stats.length > 0"
              color="green"
              variant="soft"
              size="lg"
            >
              {{ stats.filter((s) => s.id !== 0).length }} команд
            </UBadge>
            <UButton
              icon="i-mdi-refresh"
              color="primary"
              variant="soft"
              :loading="isLoading"
              @click="loadStatistics"
            >
              Обновить
            </UButton>
          </div>
        </div>

        <!-- Фильтры -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UFormGroup label="Команда" class="space-y-2">
            <USelectMenu
              v-model="selectedTeamId"
              :options="teamItems"
              value-attribute="id"
              option-attribute="name"
              placeholder="Выберите команду"
              searchable
            >
              <template #leading>
                <Icon name="i-mdi-account-group" class="w-4 h-4" />
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="Период" class="space-y-2">
            <USelectMenu
              v-model="selectedPeriod"
              :options="periodOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Выберите период"
            >
              <template #leading>
                <Icon name="i-mdi-calendar-range" class="w-4 h-4" />
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="Дата начала" class="space-y-2">
            <UDatePicker
              v-model="startDate"
              :disabled="selectedPeriod !== 'custom'"
              icon="i-mdi-calendar-start"
              :max="endDate"
              :input-props="{ placeholder: 'Дата начала' }"
              color="primary"
              size="md"
            />
          </UFormGroup>

          <UFormGroup label="Дата окончания" class="space-y-2">
            <UDatePicker
              v-model="endDate"
              :disabled="selectedPeriod !== 'custom'"
              icon="i-mdi-calendar-end"
              :min="startDate"
              :input-props="{ placeholder: 'Дата окончания' }"
              color="primary"
              size="md"
            />
          </UFormGroup>
        </div>

        <div class="flex justify-between items-center mt-6">
          <div class="flex space-x-3">
            <UButton
              icon="i-mdi-chart-line"
              color="primary"
              @click="loadStatistics"
              :loading="isLoading"
            >
              Построить отчет
            </UButton>

            <UButton
              icon="i-mdi-download"
              variant="outline"
              @click="exportToExcel"
              :disabled="filteredStats.length === 0"
            >
              Экспорт Excel
            </UButton>
          </div>

          <div
            class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <Icon name="i-mdi-clock-outline" class="w-4 h-4" />
            <span>Последнее обновление: {{ lastUpdated }}</span>
          </div>
        </div>
      </div>

      <!-- Ключевые метрики -->
      <div
        v-if="totalSummary"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Всего участников</p>
              <p class="text-3xl font-bold">
                {{ totalSummary.memberCount.toLocaleString() }}
              </p>
            </div>
            <div
              class="p-3 flex justify-center items-center bg-blue-400 bg-opacity-30 rounded-xl"
            >
              <Icon name="i-mdi-account-group" class="w-8 h-8" />
            </div>
          </div>
          <div class="mt-4 flex items-center">
            <Icon name="i-mdi-trending-up" class="w-4 h-4 mr-1" />
            <span class="text-sm"
              >{{ totalSummary.activeMembers }} активных</span
            >
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">Всего звонков</p>
              <p class="text-3xl font-bold">
                {{ totalSummary.totalCalls.toLocaleString() }}
              </p>
            </div>
            <div
              class="p-3 flex justify-center items-center bg-green-400 bg-opacity-30 rounded-xl"
            >
              <Icon name="i-mdi-phone" class="w-8 h-8" />
            </div>
          </div>
          <div class="mt-4 flex items-center">
            <Icon name="i-mdi-calendar-today" class="w-4 h-4 mr-1" />
            <span class="text-sm">{{ totalSummary.todayCalls }} сегодня</span>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">Среднее за день</p>
              <p class="text-3xl font-bold">
                {{ Math.round(totalSummary.avgCallsPerDay || 0) }}
              </p>
            </div>
            <div
              class="p-3 flex justify-center items-center bg-purple-400 bg-opacity-30 rounded-xl"
            >
              <Icon name="i-mdi-chart-line" class="w-8 h-8" />
            </div>
          </div>
          <div class="mt-4 flex items-center">
            <Icon name="i-mdi-calendar-week" class="w-4 h-4 mr-1" />
            <span class="text-sm"
              >{{ totalSummary.weekCalls || 0 }} за неделю</span
            >
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">Конверсия</p>
              <p class="text-3xl font-bold">{{ getConversionRate() }}%</p>
            </div>
            <div
              class="p-3 flex justify-center items-center bg-orange-400 bg-opacity-30 rounded-xl"
            >
              <Icon name="i-mdi-target" class="w-8 h-8" />
            </div>
          </div>
          <div class="mt-4 flex items-center">
            <Icon name="i-mdi-trending-up" class="w-4 h-4 mr-1" />
            <span class="text-sm">Эффективность команд</span>
          </div>
        </div>
      </div>

      <!-- Графики и аналитика -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- График результатов звонков -->
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800"
        >
          <div class="flex items-center justify-between mb-6">
            <h3
              class="text-xl font-bold text-gray-900 dark:text-white flex items-center"
            >
              <Icon
                name="i-mdi-chart-donut"
                class="w-6 h-6 mr-2 text-blue-500"
              />
              Результаты звонков
            </h3>
          </div>

          <div
            v-if="
              totalSummary && Object.keys(totalSummary.tagsCount || {}).length
            "
            class="h-80"
          >
            <VChart
              :option="getPieChartOption(totalSummary.tagsCount)"
              autoresize
            />
          </div>
          <div
            v-else
            class="h-80 flex items-center justify-center text-gray-400"
          >
            <div class="text-center">
              <Icon
                name="i-mdi-chart-pie"
                class="w-12 h-12 mx-auto mb-2 opacity-50"
              />
              <p>Нет данных для отображения</p>
            </div>
          </div>
        </div>

        <!-- График активности по времени -->
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800"
        >
          <div class="flex items-center justify-between mb-6">
            <h3
              class="text-xl font-bold text-gray-900 dark:text-white flex items-center"
            >
              <Icon
                name="i-mdi-chart-timeline-variant"
                class="w-6 h-6 mr-2 text-green-500"
              />
              Активность команд
            </h3>
          </div>

          <div class="h-80">
            <VChart :option="getBarChartOption()" autoresize />
          </div>
        </div>
      </div>

      <!-- Топ исполнители -->
      <div
        v-if="totalSummary?.topPerformers?.length"
        class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800"
      >
        <h3
          class="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6"
        >
          <Icon name="i-mdi-trophy" class="w-6 h-6 mr-2 text-yellow-500" />
          Топ исполнители
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="(performer, index) in totalSummary.topPerformers.slice(0, 5)"
            :key="performer.userId"
            class="relative p-4 rounded-xl transition-all duration-300 hover:scale-105"
            :class="getPerformerCardClass(index)"
          >
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  :class="getPerformerBadgeClass(index)"
                >
                  {{ index + 1 }}
                </div>
                <div v-if="index < 3" class="absolute -top-1 -right-1">
                  <Icon
                    :name="getTrophyIcon(index)"
                    class="w-5 h-5"
                    :class="getTrophyColor(index)"
                  />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ performer.login }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ performer.calls }} звонков
                </p>
              </div>
            </div>

            <div class="mt-3">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :class="getPerformerProgressClass(index)"
                  :style="{
                    width: `${
                      (performer.calls /
                        Math.max(
                          ...totalSummary.topPerformers.map((p) => p.calls)
                        )) *
                      100
                    }%`,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Детальная статистика команд -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3
            class="text-2xl font-bold text-gray-900 dark:text-white flex items-center"
          >
            <Icon name="i-mdi-view-list" class="w-7 h-7 mr-3 text-indigo-500" />
            Детальная статистика команд
          </h3>

          <div class="flex items-center space-x-2">
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                viewMode === 'cards' ? 'i-mdi-view-grid' : 'i-mdi-view-list'
              "
              @click="toggleViewMode"
            >
              {{ viewMode === "cards" ? "Сетка" : "Список" }}
            </UButton>
          </div>
        </div>

        <!-- Карточный вид -->
        <div
          v-if="viewMode === 'cards'"
          class="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div
            v-for="team in filteredStats.filter((t) => t.id !== 0)"
            :key="team.id"
            class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <!-- Заголовок команды -->
            <div
              class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xl font-bold">{{ team.name }}</h4>
                  <p
                    v-if="team.description"
                    class="text-indigo-100 text-sm mt-1"
                  >
                    {{ team.description }}
                  </p>
                </div>
                <UButton
                  variant="ghost"
                  size="sm"
                  :icon="
                    expandedTeams.has(team.id)
                      ? 'i-mdi-chevron-up'
                      : 'i-mdi-chevron-down'
                  "
                  @click="toggleTeamDetails(team.id)"
                  class="text-white hover:bg-white hover:bg-opacity-20"
                />
              </div>

              <div
                v-if="team.lastActivityDate"
                class="mt-3 flex items-center text-indigo-100 text-sm"
              >
                <Icon name="i-mdi-clock-outline" class="w-4 h-4 mr-1" />
                Активна {{ formatRelativeDate(team.lastActivityDate) }}
              </div>
            </div>

            <!-- Основные метрики -->
            <div class="p-6">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div
                  class="text-center p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg"
                >
                  <div
                    class="text-2xl font-bold text-blue-600 dark:text-blue-400"
                  >
                    {{ team.memberCount }}
                  </div>
                  <div
                    class="text-xs text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Участников
                  </div>
                </div>
                <div
                  class="text-center p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-30 rounded-lg"
                >
                  <div
                    class="text-2xl font-bold text-green-600 dark:text-green-400"
                  >
                    {{ team.totalCalls }}
                  </div>
                  <div
                    class="text-xs text-green-600 dark:text-green-400 font-medium"
                  >
                    Звонков
                  </div>
                </div>
                <div
                  class="text-center p-3 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-30 rounded-lg"
                >
                  <div
                    class="text-2xl font-bold text-orange-600 dark:text-orange-400"
                  >
                    {{ team.activeMembers }}
                  </div>
                  <div
                    class="text-xs text-orange-600 dark:text-orange-400 font-medium"
                  >
                    Активных
                  </div>
                </div>
                <div
                  class="text-center p-3 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30 rounded-lg"
                >
                  <div
                    class="text-2xl font-bold text-purple-600 dark:text-purple-400"
                  >
                    {{ Math.round(team.avgCallsPerDay) }}
                  </div>
                  <div
                    class="text-xs text-purple-600 dark:text-purple-400 font-medium"
                  >
                    В день
                  </div>
                </div>
              </div>

              <!-- Детальная информация -->
              <div
                v-if="expandedTeams.has(team.id)"
                class="space-y-6 border-t pt-6"
              >
                <!-- Мини-график для команды -->
                <div v-if="Object.keys(team.tagsCount).length" class="h-40">
                  <VChart
                    :option="getMiniPieOption(team.tagsCount, team.name)"
                    autoresize
                  />
                </div>

                <!-- Участники команды -->
                <div v-if="team.topPerformers?.length" class="space-y-3">
                  <h5 class="font-semibold text-gray-900 dark:text-white">
                    Лучшие участники:
                  </h5>
                  <div class="space-y-2">
                    <div
                      v-for="(performer, idx) in team.topPerformers.slice(0, 3)"
                      :key="performer.userId"
                      class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div class="flex items-center space-x-2">
                        <UBadge
                          :color="
                            idx === 0 ? 'yellow' : idx === 1 ? 'gray' : 'orange'
                          "
                          variant="solid"
                          size="xs"
                        >
                          {{ idx + 1 }}
                        </UBadge>
                        <span class="text-sm font-medium">{{
                          performer.login
                        }}</span>
                      </div>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{
                        performer.calls
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Дополнительные метрики -->
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div class="text-sm font-semibold">
                      {{ team.weekCalls }}
                    </div>
                    <div class="text-xs text-gray-500">За неделю</div>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div class="text-sm font-semibold">
                      {{ team.monthCalls }}
                    </div>
                    <div class="text-xs text-gray-500">За месяц</div>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div class="text-sm font-semibold">
                      {{
                        Math.round(
                          (team.activeMembers / (team.memberCount || 1)) * 100
                        )
                      }}%
                    </div>
                    <div class="text-xs text-gray-500">Активность</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Табличный вид -->
        <div
          v-else
          class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Команда
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Участников
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Звонков
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Сегодня
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Активных
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Среднее/день
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Активность
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="team in filteredStats.filter((t) => t.id !== 0)"
                  :key="team.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mr-3"
                      >
                        <span class="text-white text-sm font-bold">{{
                          team.name.charAt(0)
                        }}</span>
                      </div>
                      <div>
                        <div
                          class="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {{ team.name }}
                        </div>
                        <div
                          v-if="team.lastActivityDate"
                          class="text-xs text-gray-500"
                        >
                          {{ formatRelativeDate(team.lastActivityDate) }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white"
                  >
                    {{ team.memberCount }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <UBadge color="blue" variant="soft">{{
                      team.totalCalls
                    }}</UBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <UBadge color="green" variant="soft">{{
                      team.todayCalls
                    }}</UBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <UBadge color="purple" variant="soft">{{
                      team.activeMembers
                    }}</UBadge>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white"
                  >
                    {{ Math.round(team.avgCallsPerDay) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="flex items-center justify-center">
                      <div
                        class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2"
                      >
                        <div
                          class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                          :style="{
                            width: `${Math.min(
                              100,
                              (team.activeMembers / (team.memberCount || 1)) *
                                100
                            )}%`,
                          }"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-600 dark:text-gray-400">
                        {{
                          Math.round(
                            (team.activeMembers / (team.memberCount || 1)) * 100
                          )
                        }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div
        v-if="!isLoading && filteredStats.length === 0"
        class="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center shadow-xl border border-gray-100 dark:border-gray-800"
      >
        <Icon
          name="i-mdi-database-search"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Нет данных
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Попробуйте изменить фильтры или период для отображения статистики
        </p>
        <UButton color="primary" @click="resetFilters">
          Сбросить фильтры
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";

const toast = useToast();
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, BarChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import * as XLSX from "xlsx";

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

interface TeamStatistics {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  totalCalls: number;
  todayCalls: number;
  weekCalls: number;
  monthCalls: number;
  tagsCount: Record<string, number>;
  avgCallsPerDay: number;
  lastActivityDate: string | null;
  activeMembers: number;
  topPerformers: Array<{ userId: number; login: string; calls: number }>;
}

const teamItems = ref([{ id: 0, name: "Все команды" }]);
const selectedTeamId = ref(0);
const selectedPeriod = ref("today");
const isLoading = ref(false);
const expandedTeams = ref(new Set<number>());
const viewMode = ref<"cards" | "table">("cards");
const lastUpdated = ref("");

const periodOptions = [
  { label: "Сегодня", value: "today" },
  { label: "Вчера", value: "yesterday" },
  { label: "Эта неделя", value: "thisWeek" },
  { label: "Прошлая неделя", value: "lastWeek" },
  { label: "Этот месяц", value: "thisMonth" },
  { label: "Прошлый месяц", value: "lastMonth" },
  { label: "Выбрать период", value: "custom" },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const startDate = ref(getToday());
const endDate = ref(getToday());
const stats = ref<TeamStatistics[]>([]);

// Вычисляемые свойства
const filteredStats = computed(() => {
  if (selectedTeamId.value === 0) return stats.value;
  return stats.value.filter((team) => team.id === selectedTeamId.value);
});

const totalSummary = computed(() => {
  return filteredStats.value.find((team) => team.id === 0);
});

// Методы для работы с периодами
function updateDatesFromPeriod() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (selectedPeriod.value) {
    case "today":
      startDate.value = getToday();
      endDate.value = getToday();
      break;
    case "yesterday":
      startDate.value = yesterday.toISOString().slice(0, 10);
      endDate.value = yesterday.toISOString().slice(0, 10);
      break;
    case "thisWeek":
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      startDate.value = startOfWeek.toISOString().slice(0, 10);
      endDate.value = getToday();
      break;
    case "lastWeek":
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 6);
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - today.getDay());
      startDate.value = startOfLastWeek.toISOString().slice(0, 10);
      endDate.value = endOfLastWeek.toISOString().slice(0, 10);
      break;
    case "thisMonth":
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.value = startOfMonth.toISOString().slice(0, 10);
      endDate.value = getToday();
      break;
    case "lastMonth":
      const startOfLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      startDate.value = startOfLastMonth.toISOString().slice(0, 10);
      endDate.value = endOfLastMonth.toISOString().slice(0, 10);
      break;
  }
}

// Методы загрузки данных
async function loadTeams() {
  try {
    const response = await $fetch("/api/admin/teams/statistics_new");
    teamItems.value = [
      { id: 0, name: "Все команды" },
      ...response
        .filter((item: any) => item.id !== 0)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
        })),
    ];
  } catch (e) {
    toast.add({
      color: "red",
      title: "Ошибка загрузки команд",
      description: e?.message || String(e),
    });
    console.error("Ошибка загрузки команд:", e);
  }
}

async function loadStatistics() {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const query: Record<string, string> = {};
    if (startDate.value) query.startDate = startDate.value;
    if (endDate.value) query.endDate = endDate.value;
    if (selectedTeamId.value > 0)
      query.teamId = selectedTeamId.value.toString();

    const response = await $fetch("/api/admin/teams/statistics_new", {
      method: "GET",
      query,
    });
    stats.value = Array.isArray(response) ? response : [];
    lastUpdated.value = new Date().toLocaleString("ru-RU");
  } catch (e) {
    toast.add({
      color: "red",
      title: "Ошибка загрузки статистики",
      description: e?.message || String(e),
    });
    console.error("Ошибка загрузки статистики:", e);
  } finally {
    isLoading.value = false;
  }
}

// Методы для работы с UI
function toggleTeamDetails(teamId: number) {
  if (expandedTeams.value.has(teamId)) {
    expandedTeams.value.delete(teamId);
  } else {
    expandedTeams.value.add(teamId);
  }
}

function toggleViewMode() {
  viewMode.value = viewMode.value === "cards" ? "table" : "cards";
}

function resetFilters() {
  selectedTeamId.value = 0;
  selectedPeriod.value = "today";
  updateDatesFromPeriod();
  loadStatistics();
}

// Методы для графиков
function getPieChartOption(tagsCount: Record<string, number>) {
  const data = Object.entries(tagsCount).map(([name, value]) => ({
    name,
    value,
  }));
  if (!data.length) {
    return {
      title: { text: "Нет данных", left: "center" },
      series: [],
    };
  }
  return {
    title: {
      text: "Распределение результатов",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
      type: "scroll",
    },
    series: [
      {
        name: "Результаты",
        type: "pie",
        radius: "50%",
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
}

function getBarChartOption() {
  const teams = filteredStats.value.filter((t) => t.id !== 0);
  if (!teams.length) {
    return {
      title: { text: "Нет данных", left: "center" },
      series: [],
    };
  }
  const teamNames = teams.map((t) => t.name);
  const totalCalls = teams.map((t) => t.totalCalls);
  const todayCalls = teams.map((t) => t.todayCalls);
  const activeMembers = teams.map((t) => t.activeMembers);

  return {
    title: {
      text: "Активность команд",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Всего звонков", "Сегодня", "Активных участников"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: teamNames,
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Количество звонков",
        position: "left",
      },
      {
        type: "value",
        name: "Участники",
        position: "right",
      },
    ],
    series: [
      {
        name: "Всего звонков",
        type: "bar",
        data: totalCalls,
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "Сегодня",
        type: "bar",
        data: todayCalls,
        itemStyle: { color: "#10b981" },
      },
      {
        name: "Активных участников",
        type: "bar",
        yAxisIndex: 1,
        data: activeMembers,
        itemStyle: { color: "#f59e0b" },
      },
    ],
  };
}

function getMiniPieOption(tagsCount: Record<string, number>, teamName: string) {
  const data = Object.entries(tagsCount).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    title: {
      text: `Результаты: ${teamName}`,
      textStyle: { fontSize: 12 },
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    series: [
      {
        type: "pie",
        radius: ["30%", "70%"],
        center: ["50%", "60%"],
        data,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 10 },
        },
      },
    ],
  };
}

// Методы для форматирования
function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return `${Math.floor(diffDays / 30)} мес. назад`;
}

function getConversionRate() {
  if (!totalSummary.value || totalSummary.value.totalCalls === 0) return 0;
  const successTags = ["успешно", "договорились", "заинтересован", "продано"];
  const successCount = Object.entries(totalSummary.value.tagsCount || {})
    .filter(([tag]) =>
      successTags.some((success) => tag.toLowerCase().includes(success))
    )
    .reduce((sum, [, count]) => sum + count, 0);
  return Math.round((successCount / totalSummary.value.totalCalls) * 100);
}

// Стили для топ исполнителей
function getPerformerCardClass(index: number) {
  const classes = [
    "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border-2 border-yellow-200 dark:border-yellow-700",
    "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600",
    "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-2 border-orange-200 dark:border-orange-700",
    "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700",
    "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-200 dark:border-purple-700",
  ];
  return classes[index] || classes[4];
}

function getPerformerBadgeClass(index: number) {
  const classes = [
    "bg-gradient-to-r from-yellow-400 to-yellow-600",
    "bg-gradient-to-r from-gray-400 to-gray-600",
    "bg-gradient-to-r from-orange-400 to-orange-600",
    "bg-gradient-to-r from-blue-400 to-blue-600",
    "bg-gradient-to-r from-purple-400 to-purple-600",
  ];
  return classes[index] || classes[4];
}

function getPerformerProgressClass(index: number) {
  const classes = [
    "bg-gradient-to-r from-yellow-400 to-yellow-600",
    "bg-gradient-to-r from-gray-400 to-gray-600",
    "bg-gradient-to-r from-orange-400 to-orange-600",
    "bg-gradient-to-r from-blue-400 to-blue-600",
    "bg-gradient-to-r from-purple-400 to-purple-600",
  ];
  return classes[index] || classes[4];
}

function getTrophyIcon(index: number) {
  const icons = ["i-mdi-trophy", "i-mdi-medal", "i-mdi-medal"];
  return icons[index] || "i-mdi-star";
}

function getTrophyColor(index: number) {
  const colors = ["text-yellow-500", "text-gray-400", "text-orange-500"];
  return colors[index] || "text-blue-500";
}

// Экспорт данных
function exportToExcel() {
  if (filteredStats.value.length === 0) return;
  const data = filteredStats.value.map((team) => ({
    Команда: team.name,
    Описание: team.description || "",
    Участников: team.memberCount,
    Звонков: team.totalCalls,
    Сегодня: team.todayCalls,
    "За неделю": team.weekCalls,
    "За месяц": team.monthCalls,
    Активных: team.activeMembers,
    "Среднее/день": Math.round(team.avgCallsPerDay),
    "Последняя активность": team.lastActivityDate
      ? new Date(team.lastActivityDate).toLocaleDateString("ru-RU")
      : "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Статистика команд");
  XLSX.writeFile(wb, "team-statistics.xlsx");
}

// Watchers
watch(selectedPeriod, () => {
  if (selectedPeriod.value !== "custom") {
    updateDatesFromPeriod();
    loadStatistics();
  }
});

watch([startDate, endDate], ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (
    selectedPeriod.value === "custom" &&
    (newStart !== oldStart || newEnd !== oldEnd)
  ) {
    loadStatistics();
  }
});

// Lifecycle
onMounted(() => {
  updateDatesFromPeriod();
  loadTeams();
  loadStatistics();
});
</script>

<style scoped>
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
</style>
