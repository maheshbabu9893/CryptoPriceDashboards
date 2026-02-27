<template>
  <v-card
    class="price-card"
    :class="{
      'price-card--selected': selected,
      'price-card--compact': compact,
    }"
    rounded="lg"
    flat
    @click="$emit('click')"
  >
    <v-card-text v-if="market" class="pa-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="coin-label text-capitalize">{{ market.id }}</span>
        <v-avatar :size="compact ? 28 : 36" :color="iconBg">
          <v-icon :size="compact ? 16 : 20" color="white">{{
            coinIcon
          }}</v-icon>
        </v-avatar>
      </div>

      <div
        :class="compact ? 'text-h6' : 'text-h5'"
        class="font-weight-bold"
        style="color: #1a1a2e"
      >
        ${{ formatPrice(market.currentPrice) }}
      </div>

      <div class="d-flex align-center gap-1 mt-1">
        <v-icon
          :color="market.priceChangePercentage24h >= 0 ? '#2dce89' : '#f5365c'"
          size="14"
        >
          {{
            market.priceChangePercentage24h >= 0
              ? "mdi-arrow-up"
              : "mdi-arrow-down"
          }}
        </v-icon>
        <span
          class="text-body-2 font-weight-medium"
          :style="{
            color: market.priceChangePercentage24h >= 0 ? '#2dce89' : '#f5365c',
          }"
        >
          {{ formatPercent(market.priceChangePercentage24h) }}%
        </span>
        <span v-if="!compact" class="text-body-2" style="color: #8898aa"
          >24h</span
        >
      </div>

      <div v-if="!compact" class="text-body-2 mt-2" style="color: #8898aa">
        Mkt Cap: ${{ formatMarketCap(market.marketCap) }}
      </div>
    </v-card-text>

    <v-card-text v-else class="pa-4" style="color: #8898aa">
      Loading...
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePriceStore } from "@/stores/priceStore";

const props = defineProps<{
  assetId: string;
  selected?: boolean;
  compact?: boolean;
}>();

defineEmits<{ click: [] }>();

const priceStore = usePriceStore();
const market = computed(() => priceStore.prices[props.assetId] ?? null);

// simple icon mapping for top coins
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

const coinIcon = computed(
  () => iconMap[props.assetId]?.icon ?? "mdi-currency-btc",
);
const iconBg = computed(() => iconMap[props.assetId]?.bg ?? "#8898aa");

function formatPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(n: number): string {
  return Math.abs(n).toFixed(2);
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString("en-US");
}
</script>

<style scoped>
.price-card {
  border: 1px solid #e9ecef;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.price-card:hover {
  border-color: #2dce89;
  box-shadow: 0 4px 12px rgba(45, 206, 137, 0.12);
}

.price-card--selected {
  border-color: #2dce89 !important;
  box-shadow: 0 0 0 2px rgba(45, 206, 137, 0.2);
}

.coin-label {
  font-size: 14px;
  font-weight: 500;
  color: #8898aa;
}
</style>
