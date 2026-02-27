import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { coinGeckoApi } from "./coinGeckoApi";

// helper to create a mock Response
function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("coinGeckoApi", () => {
  describe("getMarketData", () => {
    it("returns empty array for empty coinIds", async () => {
      const result = await coinGeckoApi.getMarketData([]);
      expect(result).toEqual([]);
    });

    it("maps CoinGecko market response to MarketData[]", async () => {
      const apiResponse = [
        {
          id: "bitcoin",
          current_price: 50000,
          price_change_24h: 1200,
          price_change_percentage_24h: 2.4,
          market_cap: 950000000000,
          last_updated: "2024-01-15T12:00:00Z",
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.getMarketData(["bitcoin"]);
      expect(result).toEqual([
        {
          id: "bitcoin",
          currentPrice: 50000,
          priceChange24h: 1200,
          priceChangePercentage24h: 2.4,
          marketCap: 950000000000,
          lastUpdated: "2024-01-15T12:00:00Z",
        },
      ]);
    });

    it("filters out malformed items from the response", async () => {
      const apiResponse = [
        { id: "bitcoin", current_price: 50000, market_cap: 900000000000 },
        { id: 123, current_price: "not a number" }, // invalid
        "garbage",
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.getMarketData(["bitcoin"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("bitcoin");
    });
  });

  describe("searchCoins", () => {
    it("maps search response to SearchResult[]", async () => {
      const apiResponse = {
        coins: [
          {
            id: "bitcoin",
            name: "Bitcoin",
            symbol: "btc",
            thumb: "https://img.com/btc.png",
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.searchCoins("bit");
      expect(result).toEqual([
        {
          id: "bitcoin",
          name: "Bitcoin",
          symbol: "btc",
          thumb: "https://img.com/btc.png",
        },
      ]);
    });

    it("returns empty array for unexpected response shape", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse("not json"),
      );

      const result = await coinGeckoApi.searchCoins("xyz");
      expect(result).toEqual([]);
    });
  });

  describe("getHistoricalPrices", () => {
    it("maps price tuples to PricePoint[]", async () => {
      const apiResponse = {
        prices: [
          [1705305600000, 42000],
          [1705392000000, 43500],
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.getHistoricalPrices("bitcoin", 7);
      expect(result).toEqual([
        { timestamp: 1705305600000, price: 42000 },
        { timestamp: 1705392000000, price: 43500 },
      ]);
    });

    it("filters out malformed price tuples", async () => {
      const apiResponse = {
        prices: [
          [1705305600000, 42000],
          ["bad", "data"],
          [1705392000000], // missing price
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.getHistoricalPrices("bitcoin", 7);
      expect(result).toHaveLength(1);
    });
  });

  describe("getCoinDetail", () => {
    it("maps coin detail response to CoinDetail", async () => {
      const apiResponse = {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        image: { small: "https://img.com/eth.png" },
        description: { en: "Ethereum is a decentralized platform." },
        market_data: {
          current_price: { usd: 2500 },
          price_change_24h: -50,
          price_change_percentage_24h: -1.96,
          market_cap: { usd: 300000000000 },
          last_updated: "2024-01-15T12:00:00Z",
        },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        mockResponse(apiResponse),
      );

      const result = await coinGeckoApi.getCoinDetail("ethereum");
      expect(result.id).toBe("ethereum");
      expect(result.name).toBe("Ethereum");
      expect(result.marketData.currentPrice).toBe(2500);
      expect(result.marketData.priceChange24h).toBe(-50);
      expect(result.historicalPrices).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("throws on non-ok response (not 429)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse({}, 500));

      await expect(coinGeckoApi.getMarketData(["bitcoin"])).rejects.toThrow(
        "API error: 500",
      );
    });

    it("retries on 429 with backoff", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(mockResponse({}, 429))
        .mockResolvedValueOnce(
          mockResponse([
            { id: "bitcoin", current_price: 50000, market_cap: 900000000000 },
          ]),
        );

      const promise = coinGeckoApi.getMarketData(["bitcoin"]);
      const result = await promise;

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
    });
  });
});
