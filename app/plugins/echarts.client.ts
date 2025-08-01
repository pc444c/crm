export default defineNuxtPlugin(async () => {
  // Только на клиенте
  if (typeof window !== 'undefined' && import.meta.client) {
    try {
      const { use } = await import("echarts/core");
      const { CanvasRenderer } = await import("echarts/renderers");
      const { PieChart, LineChart, BarChart } = await import("echarts/charts");
      const {
        TitleComponent,
        TooltipComponent,
        LegendComponent,
        GridComponent,
        DataZoomComponent,
      } = await import("echarts/components");

      use([
        TitleComponent,
        TooltipComponent,
        LegendComponent,
        GridComponent,
        DataZoomComponent,
        LineChart,
        BarChart,
        PieChart,
        CanvasRenderer,
      ]);
    } catch (error) {
      console.warn('ECharts initialization failed:', error);
    }
  }
});
