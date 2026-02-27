// Core crypto asset types

export interface CryptoAsset {
  id: string; // CoinGecko coin ID (e.g., "bitcoin")
  symbol: string; // e.g., "btc"
  name: string; // e.g., "Bitcoin"
  image?: string; // thumbnail URL
}

export interface MarketData {
  id: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  lastUpdated: string; // ISO timestamp
}

export interface PricePoint {
  timestamp: number; // Unix ms
  price: number;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string; // thumbnail URL
}

export interface CoinDetail extends CryptoAsset {
  description: string;
  marketData: MarketData;
  historicalPrices: PricePoint[];
}

// Dashboard & widget types

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y";

export type WidgetType =
  | "price-card"
  | "chart"
  | "portfolio-summary"
  | "watchlist";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  assetId?: string; // required for price-card and chart
  timeRange?: TimeRange; // for chart widgets
}

export interface LayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: LayoutItem[];
}

export interface Watchlist {
  id: string;
  name: string;
  assets: CryptoAsset[];
}
