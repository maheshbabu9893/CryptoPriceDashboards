import { defineStore } from "pinia";
import { ref } from "vue";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import type { MarketData } from "@/types";

export const usePriceStore = defineStore("prices", () => {
  // price data keyed by coin id
  const prices = ref<Record<string, MarketData>>({});
  const lastUpdated = ref<number | null>(null);
  const isStale = ref(false);
  const refreshInterval = ref(60_000); // 60s — CoinGecko free tier rate limits are tight
  const isLoading = ref(false);

  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  // the coin ids we're currently tracking (set externally via fetchPrices)
  let activeCoinIds: string[] = [];

  async function fetchPrices(coinIds: string[]) {
    if (coinIds.length === 0) return;

    activeCoinIds = coinIds;
    isLoading.value = true;

    try {
      const data = await coinGeckoApi.getMarketData(coinIds);

      // update the prices map with fresh data
      const updated: Record<string, MarketData> = {};
      for (const item of data) {
        updated[item.id] = item;
      }
      prices.value = updated;
      lastUpdated.value = Date.now();
      isStale.value = false;
    } catch (err) {
      // keep old prices around — just flag them as stale
      console.warn("Price fetch failed, retaining stale data:", err);
      isStale.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function startAutoRefresh() {
    // don't stack timers
    stopAutoRefresh();

    refreshTimer = setInterval(() => {
      if (activeCoinIds.length > 0) {
        fetchPrices(activeCoinIds);
      }
    }, refreshInterval.value);
  }

  function stopAutoRefresh() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function setRefreshInterval(ms: number) {
    refreshInterval.value = ms;

    // restart the timer if it's running so the new interval takes effect
    if (refreshTimer !== null) {
      startAutoRefresh();
    }
  }

  return {
    prices,
    lastUpdated,
    isStale,
    refreshInterval,
    isLoading,
    fetchPrices,
    startAutoRefresh,
    stopAutoRefresh,
    setRefreshInterval,
  };
});
