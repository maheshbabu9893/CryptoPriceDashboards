<template>
  <div class="dash">
    <div
      v-if="priceStore.isLoading && coins.length === 0"
      class="text-center py-12"
    >
      <v-progress-circular indeterminate color="primary" size="44" />
      <p class="mt-3 muted">Loading prices...</p>
    </div>
    <template v-else>
      <!-- coins grid -->
      <div class="coins-grid">
        <div
          v-for="id in topCoins"
          :key="id"
          class="coin-card"
          :class="{ active: chartCoin === id }"
          @click="selectCoin(id)"
        >
          <div class="coin-card-top">
            <v-avatar :size="32" :color="iconMap[id]?.bg || '#8898aa'">
              <v-icon size="18" color="white">{{
                iconMap[id]?.icon || "mdi-currency-btc"
              }}</v-icon>
            </v-avatar>
            <div class="coin-card-info">
              <span class="coin-card-name">{{ id }}</span>
              <span class="coin-card-range">{{ range }}</span>
            </div>
          </div>
          <div class="coin-card-bottom" v-if="priceStore.prices[id]">
            <span class="coin-card-price"
              >${{ fmtShort(priceStore.prices[id].currentPrice) }}</span
            >
            <span
              class="coin-card-pct"
              :style="{
                color:
                  priceStore.prices[id].priceChangePercentage24h >= 0
                    ? '#2dce89'
                    : '#f5365c',
              }"
            >
              {{ priceStore.prices[id].priceChangePercentage24h >= 0 ? "+" : ""
              }}{{ priceStore.prices[id].priceChangePercentage24h.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
      <!-- main content -->
      <div class="content-grid">
        <div class="chart-section">
          <div class="card">
            <div class="card-head">
              <span class="card-title text-capitalize"
                >{{ chartCoin }} Price</span
              >
              <div class="range-btns">
                <button
                  v-for="r in ranges"
                  :key="r"
                  :class="{ 'range-active': range === r }"
                  @click="range = r"
                >
                  {{ r }}
                </button>
              </div>
            </div>
            <ChartWidget :asset-id="chartCoin" :time-range="range" />
          </div>
        </div>
        <div class="side-section">
          <div class="card">
            <div class="card-head">
              <span class="card-title">Top Gainers</span>
            </div>
            <div class="lb">
              <div
                v-for="(c, i) in gainers"
                :key="c.id"
                class="lb-row"
                @click="selectCoin(c.id)"
              >
                <span class="lb-rank">{{ i + 1 }}</span>
                <v-avatar
                  :size="22"
                  :color="iconMap[c.id]?.bg || '#8898aa'"
                  class="mr-2"
                >
                  <v-icon size="12" color="white">{{
                    iconMap[c.id]?.icon || "mdi-currency-btc"
                  }}</v-icon>
                </v-avatar>
                <span class="lb-name">{{ c.id }}</span>
                <span
                  class="lb-pct"
                  :style="{
                    color:
                      c.priceChangePercentage24h >= 0 ? '#2dce89' : '#f5365c',
                  }"
                >
                  {{ c.priceChangePercentage24h >= 0 ? "+" : ""
                  }}{{ c.priceChangePercentage24h.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { usePriceStore } from "@/stores/priceStore";
import { useChartPanel } from "@/composables/useChartPanel";
import ChartWidget from "@/components/ChartWidget.vue";
import type { TimeRange } from "@/types";
const priceStore = usePriceStore();
const { openPanel } = useChartPanel();
const topCoins = [
  "bitcoin",
  "ethereum",
  "solana",
  "cardano",
  "ripple",
  "dogecoin",
  "polkadot",
  "chainlink",
];
const chartCoin = ref("bitcoin");
const range = ref<TimeRange>("7d");
const ranges: TimeRange[] = ["24h", "7d", "30d", "90d", "1y"];
const coins = computed(() => Object.values(priceStore.prices));
const gainers = computed(() =>
  [...coins.value]
    .sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h)
    .slice(0, 8),
);
const iconMap: Record<string, { icon: string; bg: string }> = {
  bitcoin: { icon: "mdi-currency-btc", bg: "#f7931a" },
  ethereum: { icon: "mdi-ethereum", bg: "#627eea" },
  solana: { icon: "mdi-lightning-bolt", bg: "#9945ff" },
  cardano: { icon: "mdi-cards-diamond", bg: "#0033ad" },
  ripple: { icon: "mdi-alpha-x-circle", bg: "#23292f" },
  dogecoin: { icon: "mdi-dog", bg: "#c2a633" },
  polkadot: { icon: "mdi-circle-multiple", bg: "#e6007a" },
  chainlink: { icon: "mdi-link-variant", bg: "#2a5ada" },
};
function selectCoin(id: string) {
  chartCoin.value = id;
  openPanel(id);
}
function fmtShort(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
onMounted(() => {
  priceStore.fetchPrices(topCoins);
  priceStore.startAutoRefresh();
});
onBeforeUnmount(() => {
  priceStore.stopAutoRefresh();
});
</script>
<style scoped>
.dash {
  padding: 24px 40px;
}
.muted {
  color: #8898aa;
  font-size: 14px;
}

/* coins grid */
.coins-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
@media (max-width: 1100px) {
  .coins-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .coins-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.coin-card {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.2s;
}
.coin-card:hover {
  border-color: #2dce89;
  box-shadow: 0 4px 14px rgba(45, 206, 137, 0.1);
}
.coin-card.active {
  border-color: #2dce89;
  background: rgba(45, 206, 137, 0.03);
  box-shadow: 0 0 0 2px rgba(45, 206, 137, 0.15);
}
.coin-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.coin-card-info {
  display: flex;
  flex-direction: column;
}
.coin-card-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  text-transform: capitalize;
  line-height: 1.2;
}
.coin-card-range {
  font-size: 11px;
  color: #adb5bd;
  font-weight: 500;
}
.coin-card-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.coin-card-price {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}
.coin-card-pct {
  font-size: 13px;
  font-weight: 700;
}

/* content grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}
@media (max-width: 960px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* cards */
.card {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 14px;
  padding: 20px 24px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
}

/* range buttons */
.range-btns {
  display: flex;
  gap: 4px;
}
.range-btns button {
  padding: 4px 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #8898aa;
  cursor: pointer;
  transition: all 0.15s;
}
.range-btns button:hover {
  border-color: #2dce89;
  color: #2dce89;
}
.range-btns .range-active {
  background: #2dce89;
  color: #fff;
  border-color: #2dce89;
}

/* leaderboard */
.lb {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.lb-row:hover {
  background: #f5f7fa;
}
.lb-rank {
  width: 18px;
  font-size: 12px;
  font-weight: 700;
  color: #adb5bd;
}
.lb-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  text-transform: capitalize;
}
.lb-pct {
  font-size: 13px;
  font-weight: 700;
}
</style>
