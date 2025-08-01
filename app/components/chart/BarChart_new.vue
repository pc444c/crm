<template>
  <div class="w-full h-full" :style="{ height: `${height}px` }">
    <svg ref="chart" width="100%" :height="height" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import * as d3 from "d3";

interface ChartItem {
  label?: string;
  value?: number;
  tag_name?: string;
  count?: number;
  color?: string;
  [key: string]: any;
}

interface YAxisConfig {
  label?: string;
  min?: number;
  max?: number;
}

const props = defineProps({
  data: {
    type: Array as () => ChartItem[],
    required: true,
  },
  height: {
    type: Number,
    default: 300,
  },
  categories: {
    type: Array as () => Array<string>,
    default: () => [],
  },
  yAxis: {
    type: Object as () => YAxisConfig,
    default: () => ({ label: "", min: 0 }),
  },
  title: {
    type: String,
    default: "",
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
    default: (i: unknown) => i,
  },
  hideLegend: {
    type: Boolean,
    default: false,
  },
});

const chart = ref<SVGSVGElement | null>(null);

const margin = { top: 20, right: 20, bottom: 40, left: 40 };
const width = computed(() => {
  if (!chart.value) return 500;
  return chart.value.clientWidth || 500;
});

const renderChart = () => {
  if (!chart.value || !props.data.length) return;

  d3.select(chart.value).selectAll("*").remove();

  const svg = d3.select(chart.value);

  const w = width.value - margin.left - margin.right;
  const h = props.height - margin.top - margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X scale
  const x = d3
    .scaleBand()
    .domain(d3.range(props.data.length).map(String))
    .range([0, w])
    .padding(0.3);

  // Find max value for y domain
  const maxValue = d3.max(props.data, (d) => d.value || d.count || 0) || 0;

  // Y scale
  const y = d3
    .scaleLinear()
    .domain([0, maxValue * 1.1])
    .nice()
    .range([h, 0]);

  // X Axis
  const xAxis = d3
    .axisBottom(x)
    .tickFormat((i: unknown) => props.xFormatter(i))
    .ticks(props.xNumTicks);

  // Y Axis
  const yAxis = d3.axisLeft(y);

  // Y grid lines
  if (props.yGridLine) {
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-w)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "rgba(255, 255, 255, 0.1)");
  }

  // Draw axes
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${h})`)
    .call(xAxis)
    .selectAll("text")
    .attr("class", "text-xs")
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle");

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .selectAll("text")
    .attr("class", "text-xs")
    .attr("fill", "currentColor");

  // Draw bars for simple bar chart
  g.selectAll(".bar")
    .data(props.data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (_d, i) => x(String(i)) || 0)
    .attr("y", (d) => y(d.value || d.count || 0))
    .attr("width", x.bandwidth())
    .attr("height", (d) => h - y(d.value || d.count || 0))
    .attr("rx", props.radius)
    .attr("ry", props.radius)
    .attr("fill", (d) => {
      if (d.color) {
        switch ((d.color || "").toLowerCase()) {
          case "success":
            return "#22c55e";
          case "error":
            return "#ef4444";
          case "info":
            return "#3b82f6";
          case "warning":
            return "#f59e0b";
          case "primary":
            return "#06b6d4";
          case "secondary":
            return "#a855f7";
          default:
            return d.color || "#64748b";
        }
      }
      return "#3b82f6";
    })
    .attr("opacity", 0.8)
    .on("mouseover", function () {
      d3.select(this).attr("opacity", 1);
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 0.8);
    });

  // Draw legend
  if (!props.hideLegend && props.data.length > 0) {
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width.value - margin.right - 100}, ${margin.top})`
      );

    props.data.forEach((item, i) => {
      // Ограничиваем количество элементов в легенде до 10
      if (i >= 10) return;

      const name = item.label || item.tag_name || `Элемент ${i + 1}`;
      const color = item.color || "#3b82f6";

      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color)
        .attr("rx", 2)
        .attr("ry", 2);

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 9)
        .attr("fill", "currentColor")
        .attr("class", "text-xs")
        .text(name);
    });
  }
};

watch(() => props.data, renderChart, { deep: true });
watch(() => props.height, renderChart);
watch(() => props.yAxis, renderChart, { deep: true });
watch(() => props.categories, renderChart, { deep: true });

onMounted(() => {
  renderChart();

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
