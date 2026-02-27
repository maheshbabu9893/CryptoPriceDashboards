import type { MarketData, SearchResult, PricePoint, CoinDetail } from "@/types";

const BASE_URL = "/api/coingecko";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

// -- Type guards to validate API responses --

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function isValidMarketItem(item: unknown): item is Record<string, unknown> {
  if (!isObject(item)) return false;
  return (
    typeof item.id === "string" &&
    typeof item.current_price === "number" &&
    typeof item.market_cap === "number"
  );
}

function isValidSearchCoin(item: unknown): item is Record<string, unknown> {
  if (!isObject(item)) return false;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.symbol === "string"
  );
}

// -- Fetch with timeout + exponential backoff on 429 --

async function fetchWithRetry(url: string): Promise<Response> {
  let delay = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429 && attempt < MAX_RETRIES) {
        // rate limited — back off and retry
        await sleep(delay);
        delay *= 2;
        continue;
      }

      if (!res.ok) {
        // don't retry server errors — only 429 gets retried above
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res;
    } catch (err: unknown) {
      clearTimeout(timer);

      // if it's an abort (timeout), wrap it in a friendlier message
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
      }

      // non-retryable errors (like HTTP 4xx/5xx) — just throw
      if (err instanceof Error && err.message.startsWith("API error:")) {
        throw err;
      }

      // on last attempt, just throw whatever we got
      if (attempt === MAX_RETRIES) throw err;

      // network error — retry with backoff
      await sleep(delay);
      delay *= 2;
    }
  }

  // shouldn't reach here, but just in case
  throw new Error("Max retries exceeded");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -- Response mappers --

function toMarketData(raw: Record<string, unknown>): MarketData {
  return {
    id: raw.id as string,
    currentPrice: raw.current_price as number,
    priceChange24h: (raw.price_change_24h as number) ?? 0,
    priceChangePercentage24h: (raw.price_change_percentage_24h as number) ?? 0,
    marketCap: raw.market_cap as number,
    lastUpdated: (raw.last_updated as string) ?? new Date().toISOString(),
  };
}

function toSearchResult(raw: Record<string, unknown>): SearchResult {
  return {
    id: raw.id as string,
    name: raw.name as string,
    symbol: raw.symbol as string,
    thumb: (raw.thumb as string) ?? "",
  };
}

// -- Public API --

export interface CoinGeckoApi {
  getMarketData(coinIds: string[]): Promise<MarketData[]>;
  searchCoins(query: string): Promise<SearchResult[]>;
  getHistoricalPrices(coinId: string, days: number): Promise<PricePoint[]>;
  getCoinDetail(coinId: string): Promise<CoinDetail>;
}

export const coinGeckoApi: CoinGeckoApi = {
  async getMarketData(coinIds: string[]): Promise<MarketData[]> {
    if (coinIds.length === 0) return [];

    const ids = coinIds.join(",");
    const url = `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
    const res = await fetchWithRetry(url);
    const data: unknown = await res.json();

    if (!Array.isArray(data)) {
      console.warn("getMarketData: unexpected response shape, expected array");
      return [];
    }

    // only keep items that pass validation
    return data.filter(isValidMarketItem).map(toMarketData);
  },

  async searchCoins(query: string): Promise<SearchResult[]> {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
    const res = await fetchWithRetry(url);
    const data: unknown = await res.json();

    if (!isObject(data) || !Array.isArray(data.coins)) {
      console.warn("searchCoins: unexpected response shape");
      return [];
    }

    return (data.coins as unknown[])
      .filter(isValidSearchCoin)
      .map(toSearchResult);
  },

  async getHistoricalPrices(
    coinId: string,
    days: number,
  ): Promise<PricePoint[]> {
    const url = `${BASE_URL}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetchWithRetry(url);
    const data: unknown = await res.json();

    if (!isObject(data) || !Array.isArray(data.prices)) {
      console.warn("getHistoricalPrices: unexpected response shape");
      return [];
    }

    // CoinGecko returns prices as [timestamp, price] tuples
    return (data.prices as unknown[])
      .filter(
        (p): p is [number, number] =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === "number" &&
          typeof p[1] === "number",
      )
      .map(([timestamp, price]) => ({ timestamp, price }));
  },

  async getCoinDetail(coinId: string): Promise<CoinDetail> {
    const url = `${BASE_URL}/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const res = await fetchWithRetry(url);
    const data: unknown = await res.json();

    if (!isObject(data)) {
      throw new Error("getCoinDetail: unexpected response shape");
    }

    const md = data.market_data as Record<string, unknown> | undefined;

    return {
      id: data.id as string,
      symbol: (data.symbol as string) ?? "",
      name: (data.name as string) ?? "",
      image: isObject(data.image) ? (data.image.small as string) : undefined,
      description: isObject(data.description)
        ? ((data.description.en as string) ?? "")
        : "",
      marketData: {
        id: data.id as string,
        currentPrice: md?.current_price
          ? ((md.current_price as Record<string, number>).usd ?? 0)
          : 0,
        priceChange24h: md?.price_change_24h
          ? (md.price_change_24h as number)
          : 0,
        priceChangePercentage24h: md?.price_change_percentage_24h
          ? (md.price_change_percentage_24h as number)
          : 0,
        marketCap: md?.market_cap
          ? ((md.market_cap as Record<string, number>).usd ?? 0)
          : 0,
        lastUpdated: (md?.last_updated as string) ?? new Date().toISOString(),
      },
      historicalPrices: [], // fetched separately via getHistoricalPrices
    };
  },
};
