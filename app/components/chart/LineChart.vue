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

  // Рисуем линии и точки для каждой категории
  props.yAxis.forEach((key, keyIndex) => {
    const category = props.categories[key];

    // Создаем линию
    const line = d3
      .line()
      .x((d, i) => x(i) + x.bandwidth() / 2)
      .y((d) => y(d[key] || 0))
      .curve(d3.curveMonotoneX); // Плавная кривая

    // Рисуем линию
    g.append("path")
      .datum(props.data)
      .attr("fill", "none")
      .attr("stroke", category.color || "#22c55e")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line);

    // Добавляем точки
    g.selectAll(`.point-${keyIndex}`)
      .data(props.data)
      .join("circle")
      .attr("class", `point-${keyIndex}`)
      .attr("cx", (d, i) => x(i) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d[key] || 0))
      .attr("r", props.radius)
      .attr("fill", category.color || "#22c55e")
      .attr("stroke", "#1c1c1c")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .on("mouseover", function () {
        d3.select(this)
          .attr("opacity", 1)
          .attr("r", props.radius + 2);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8).attr("r", props.radius);
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
        .append("line")
        .attr("x1", 0)
        .attr("y1", i * 20 + 6)
        .attr("x2", 12)
        .attr("y2", i * 20 + 6)
        .attr("stroke", category.color || "#22c55e")
        .attr("stroke-width", 2);

      legend
        .append("circle")
        .attr("cx", 6)
        .attr("cy", i * 20 + 6)
        .attr("r", 3)
        .attr("fill", category.color || "#22c55e")
        .attr("stroke", "#1c1c1c")
        .attr("stroke-width", 1);

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
