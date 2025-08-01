<template>
  <div class="w-full h-full" :style="{ height: `${height}px` }">
    <svg ref="chart" width="100%" :height="height" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import * as d3 from "d3";

// Определение пропсов
const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  height: {
    type: Number,
    default: 300,
  },
  categories: {
    type: Object,
    required: true,
  },
  yAxis: {
    type: Array,
    default: () => [],
  },
  xNumTicks: {
    type: Number,
    default: 5,
  },
  radius: {
    type: Number,
    default: 4,
  },
  yGridLine: {
    type: Boolean,
    default: true,
  },
  xFormatter: {
    type: Function,
    default: (i) => i,
  },
  hideLegend: {
    type: Boolean,
    default: false,
  },
});

// Ссылка на SVG элемент
const chart = ref(null);

// Переменные для графика
const margin = { top: 20, right: 20, bottom: 40, left: 40 };
const width = computed(() => {
  if (!chart.value) return 500;
  return chart.value.clientWidth;
});

// Функция для рендеринга графика
const renderChart = () => {
  if (!chart.value || !props.data.length) return;

  // Очищаем предыдущий график
  d3.select(chart.value).selectAll("*").remove();

  const svg = d3.select(chart.value);

  // Вычисляем ширину и высоту
  const w = width.value - margin.left - margin.right;
  const h = props.height - margin.top - margin.bottom;

  // Создаем группу для графика
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Создаем масштабы для осей
  const x = d3
    .scaleBand()
    .domain(d3.range(props.data.length))
    .range([0, w])
    .padding(0.3);

  // Находим максимальное значение для оси Y
  const maxValue = d3.max(props.data, (d) =>
    props.yAxis.reduce((max, key) => Math.max(max, d[key] || 0), 0)
  );

  const y = d3
    .scaleLinear()
    .domain([0, maxValue * 1.1]) // Добавляем 10% сверху для лучшего вида
    .range([h, 0]);

  // Создаем оси
  const xAxis = d3
    .axisBottom(x)
    .tickFormat((i) => props.xFormatter(i))
    .ticks(props.xNumTicks);

  const yAxis = d3.axisLeft(y);

  // Добавляем сетку по оси Y, если нужно
  if (props.yGridLine) {
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-w).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "rgba(255, 255, 255, 0.1)");
  }

  // Добавляем ось X
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${h})`)
    .call(xAxis)
    .selectAll("text")
    .attr("class", "text-xs")
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle");

  // Добавляем ось Y
  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .selectAll("text")
    .attr("class", "text-xs")
    .attr("fill", "currentColor");

  // Рисуем столбцы для каждой категории
  props.yAxis.forEach((key, keyIndex) => {
    const category = props.categories[key];

    g.selectAll(`.bar-${keyIndex}`)
      .data(props.data)
      .join("rect")
      .attr("class", `bar-${keyIndex}`)
      .attr("x", (d, i) => x(i))
      .attr("y", (d) => y(d[key] || 0))
      .attr("width", x.bandwidth())
      .attr("height", (d) => h - y(d[key] || 0))
      .attr("rx", props.radius)
      .attr("ry", props.radius)
      // Используем цвет из данных, если доступен и включена опция useColorFromData
      .attr("fill", (d) => {
        if (category.useColorFromData && d.color) {
          // Преобразуем цвета в стандартные цветовые коды CSS
          switch (d.color.toLowerCase()) {
            case "success": return "#22c55e";
            case "error": return "#ef4444";
            case "info": return "#3b82f6";
            case "warning": return "#f59e0b";
            case "primary": return "#06b6d4";
            case "secondary": return "#a855f7";
            default: return d.color || "#64748b"; // neutral
          }
        }
        return category.color || "#3b82f6";
      })
      .attr("opacity", 0.8)
      .on("mouseover", function () {
        d3.select(this).attr("opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8);
      });
  });

  // Добавляем легенду, если нужно
  if (!props.hideLegend && props.yAxis.length > 1) {
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width.value - margin.right - 100}, ${margin.top})`
      );

    props.yAxis.forEach((key, i) => {
      const category = props.categories[key];

      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", category.color || "#3b82f6")
        .attr("rx", 2)
        .attr("ry", 2);

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 9)
        .attr("fill", "currentColor")
        .attr("class", "text-xs")
        .text(category.name || key);
    });
  }
};

// Отслеживаем изменения данных и перерисовываем график
watch(() => props.data, renderChart, { deep: true });
watch(() => props.height, renderChart);
watch(() => props.yAxis, renderChart, { deep: true });
watch(() => props.categories, renderChart, { deep: true });

// Рендерим график после монтирования компонента
onMounted(() => {
  renderChart();

  // Ресайз графика при изменении размера окна
  const resizeObserver = new ResizeObserver(() => {
    renderChart();
  });

  if (chart.value) {
    resizeObserver.observe(chart.value);
  }
});
</script>

<style scoped>
.grid line {
  stroke: rgba(255, 255, 255, 0.1);
}
.grid path {
  stroke-width: 0;
}
.x-axis path,
.y-axis path,
.x-axis line,
.y-axis line {
  stroke: rgba(255, 255, 255, 0.2);
}
</style>
