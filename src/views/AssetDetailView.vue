<template>
  <div class="asset-detail pa-4">
    <!-- back button -->
    <v-btn variant="text" size="small" class="mb-2" @click="router.push('/')">
      <v-icon start>mdi-arrow-left</v-icon>
      Back to Dashboard
    </v-btn>

    <!-- loading -->
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading asset details...</p>
    </div>

    <!-- error -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" @click="fetchDetail">Retry</v-btn>
      </template>
    </v-alert>

    <!-- detail content -->
    <template v-else-if="coin">
      <!-- header -->
      <div class="d-flex align-center mb-4">
        <v-avatar v-if="coin.image" size="48" class="mr-3">
          <v-img :src="coin.image" :alt="coin.name" />
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-bold">{{ coin.name }}</h1>
          <span class="text-medium-emphasis">{{
            coin.symbol.toUpperCase()
          }}</span>
        </div>
      </div>

      <!-- price info -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-caption text-medium-emphasis">Price</div>
            <div class="text-h6 font-weight-bold">
              ${{ formatPrice(coin.marketData.currentPrice) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-caption text-medium-emphasis">24h Change</div>
            <div
              class="text-h6 font-weight-bold"
              :class="
                coin.marketData.priceChangePercentage24h >= 0
                  ? 'text-success'
                  : 'text-error'
              "
            >
              {{ coin.marketData.priceChangePercentage24h >= 0 ? "+" : ""
              }}{{ coin.marketData.priceChangePercentage24h.toFixed(2) }}%
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-caption text-medium-emphasis">Market Cap</div>
            <div class="text-h6 font-weight-bold">
              ${{ formatMarketCap(coin.marketData.marketCap) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- chart -->
      <ChartWidget :asset-id="coinId" class="mb-4" />

      <!-- description -->
      <v-card v-if="coin.description" variant="outlined" class="pa-4">
        <h3 class="text-subtitle-1 font-weight-bold mb-2">
          About {{ coin.name }}
        </h3>
        <div class="text-body-2" v-html="coin.description" />
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import ChartWidget from "@/components/ChartWidget.vue";
import type { CoinDetail } from "@/types";

const route = useRoute();
const router = useRouter();

const coinId = ref(route.params.id as string);
const coin = ref<CoinDetail | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

async function fetchDetail() {
  isLoading.value = true;
  error.value = null;

  try {
    coin.value = await coinGeckoApi.getCoinDetail(coinId.value);
  } catch (err) {
    console.warn("Failed to fetch coin detail:", err);
    error.value = "Could not load asset details. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

function formatPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString("en-US");
}

// re-fetch if navigating between assets
watch(
  () => route.params.id,
  (newId) => {
    if (newId && newId !== coinId.value) {
      coinId.value = newId as string;
      fetchDetail();
    }
  },
);

onMounted(() => fetchDetail());
</script>
