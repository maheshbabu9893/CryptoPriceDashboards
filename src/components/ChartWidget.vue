<template>
  <div class="chart-wrap">
    <div v-if="isLoading" class="chart-loading">
      <v-progress-circular indeterminate color="primary" size="32" width="3" />
    </div>
    <div v-else-if="error" class="chart-msg">{{ error }}</div>
    <div v-else-if="priceData.length === 0" class="chart-msg">
      No data available
    </div>
    <div
      v-show="!isLoading && !error && priceData.length > 0"
      ref="chartEl"
      class="chart-el"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import type { PricePoint, TimeRange } from "@/types";
const props = defineProps<{ assetId: string; timeRange?: TimeRange }>();
const rangeDays: Record<TimeRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};
const priceData = ref<PricePoint[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const chartEl = ref<HTMLElement | null>(null);
async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    priceData.value = await coinGeckoApi.getHistoricalPrices(
      props.assetId,
      rangeDays[props.timeRange ?? "7d"],
    );
  } catch {
    error.value = "Failed to load chart";
    priceData.value = [];
  } finally {
    isLoading.value = false;
  }
}
async function render() {
  await nextTick();
  if (!chartEl.value || priceData.value.length === 0) return;
  const Plotly = await import("plotly.js-dist-min");
  const x = priceData.value.map((p) => new Date(p.timestamp));
  const y = priceData.value.map((p) => p.price);
  Plotly.newPlot(
    chartEl.value,
    [
      {
        x,
        y,
        type: "scatter",
        mode: "lines",
        line: { color: "#2dce89", width: 2.5, shape: "spline" },
        fill: "tozeroy",
        fillcolor: "rgba(45,206,137,0.06)",
        hovertemplate: "$%{y:,.2f}<br>%{x|%b %d}<extra></extra>",
      },
    ],
    {
      margin: { t: 8, r: 16, b: 36, l: 56 },
      xaxis: { type: "date", gridcolor: "#f0f2f5", linecolor: "#edf0f5" },
      yaxis: { tickprefix: "$", gridcolor: "#f0f2f5", linecolor: "#edf0f5" },
      autosize: true,
      height: 280,
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { family: "inherit", size: 11, color: "#8898aa" },
    },
    { responsive: true, displayModeBar: false },
  );
}
watch(
  () => props.assetId,
  () => fetchData(),
);
watch(
  () => props.timeRange,
  () => fetchData(),
);
watch([priceData, isLoading], ([d, l]) => {
  if (!l && d.length > 0) render();
});
onMounted(() => fetchData());
onBeforeUnmount(() => {
  if (chartEl.value)
    import("plotly.js-dist-min").then((P) => {
      if (chartEl.value) P.purge(chartEl.value);
    });
});
</script>
<style scoped>
.chart-wrap {
  min-height: 280px;
}
.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}
.chart-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #8898aa;
  font-size: 14px;
}
.chart-el {
  width: 100%;
  height: 280px;
}
</style>
