import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePriceStore } from "./priceStore";

// mock the API module
vi.mock("@/services/coinGeckoApi", () => ({
  coinGeckoApi: {
    getMarketData: vi.fn(),
  },
}));

import { coinGeckoApi } from "@/services/coinGeckoApi";
const mockGetMarketData = vi.mocked(coinGeckoApi.getMarketData);

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockGetMarketData.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("priceStore", () => {
  it("starts with sensible defaults", () => {
    const store = usePriceStore();
    expect(store.prices).toEqual({});
    expect(store.lastUpdated).toBeNull();
    expect(store.isStale).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.refreshInterval).toBe(30_000);
  });

  it("fetches prices and updates state", async () => {
    mockGetMarketData.mockResolvedValueOnce([
      {
        id: "bitcoin",
        currentPrice: 50000,
        priceChange24h: 500,
        priceChangePercentage24h: 1.0,
        marketCap: 900_000_000_000,
        lastUpdated: "2024-01-15T12:00:00Z",
      },
    ]);

    const store = usePriceStore();
    await store.fetchPrices(["bitcoin"]);

    expect(store.prices["bitcoin"]).toBeDefined();
    expect(store.prices["bitcoin"].currentPrice).toBe(50000);
    expect(store.lastUpdated).not.toBeNull();
    expect(store.isStale).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  it("retains old prices and marks stale on fetch failure", async () => {
    const store = usePriceStore();

    // seed some data first
    mockGetMarketData.mockResolvedValueOnce([
      {
        id: "ethereum",
        currentPrice: 2500,
        priceChange24h: -30,
        priceChangePercentage24h: -1.2,
        marketCap: 300_000_000_000,
        lastUpdated: "2024-01-15T12:00:00Z",
      },
    ]);
    await store.fetchPrices(["ethereum"]);
    expect(store.isStale).toBe(false);

    // now simulate a failure
    mockGetMarketData.mockRejectedValueOnce(new Error("network down"));
    await store.fetchPrices(["ethereum"]);

    // old data should still be there
    expect(store.prices["ethereum"].currentPrice).toBe(2500);
    expect(store.isStale).toBe(true);
  });

  it("does nothing for empty coin list", async () => {
    const store = usePriceStore();
    await store.fetchPrices([]);
    expect(mockGetMarketData).not.toHaveBeenCalled();
  });

  it("auto-refresh calls fetchPrices on interval", async () => {
    mockGetMarketData.mockResolvedValue([]);

    const store = usePriceStore();
    // kick off with some ids so the timer has something to fetch
    await store.fetchPrices(["bitcoin"]);
    mockGetMarketData.mockClear();

    store.startAutoRefresh();

    // advance past one interval
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mockGetMarketData).toHaveBeenCalledTimes(1);

    store.stopAutoRefresh();

    // shouldn't fire again after stopping
    mockGetMarketData.mockClear();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mockGetMarketData).not.toHaveBeenCalled();
  });

  it("setRefreshInterval restarts the timer if running", async () => {
    mockGetMarketData.mockResolvedValue([]);

    const store = usePriceStore();
    await store.fetchPrices(["bitcoin"]);
    mockGetMarketData.mockClear();

    store.startAutoRefresh();
    store.setRefreshInterval(10_000);

    // should fire at the new 10s interval, not the old 30s
    await vi.advanceTimersByTimeAsync(10_000);
    expect(mockGetMarketData).toHaveBeenCalledTimes(1);

    store.stopAutoRefresh();
  });
});
