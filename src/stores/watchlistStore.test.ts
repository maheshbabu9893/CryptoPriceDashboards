import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWatchlistStore } from "./watchlistStore";
import { useDashboardStore } from "./dashboardStore";
import type { CryptoAsset } from "@/types";

const btc: CryptoAsset = { id: "bitcoin", symbol: "btc", name: "Bitcoin" };
const eth: CryptoAsset = { id: "ethereum", symbol: "eth", name: "Ethereum" };

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("watchlistStore", () => {
  it("creates a watchlist and auto-selects it", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("My Coins");

    expect(store.watchlists[id]).toBeDefined();
    expect(store.watchlists[id].name).toBe("My Coins");
    expect(store.activeWatchlistId).toBe(id);
  });

  it("supports multiple watchlists", () => {
    const store = useWatchlistStore();
    const id1 = store.createWatchlist("DeFi");
    const id2 = store.createWatchlist("Layer 1s");

    expect(Object.keys(store.watchlists)).toHaveLength(2);
    // first one stays active
    expect(store.activeWatchlistId).toBe(id1);
  });

  it("deletes a watchlist and picks a new active", () => {
    const store = useWatchlistStore();
    const id1 = store.createWatchlist("First");
    const id2 = store.createWatchlist("Second");

    store.deleteWatchlist(id1);

    expect(store.watchlists[id1]).toBeUndefined();
    expect(store.activeWatchlistId).toBe(id2);
  });

  it("nulls activeWatchlistId when last watchlist is deleted", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("Only One");
    store.deleteWatchlist(id);

    expect(store.activeWatchlistId).toBeNull();
  });

  it("adds assets without duplicates", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("Test");

    store.addAsset(id, btc);
    store.addAsset(id, btc); // duplicate — should be ignored
    store.addAsset(id, eth);

    expect(store.watchlists[id].assets).toHaveLength(2);
  });

  it("removes an asset from a watchlist", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("Test");
    store.addAsset(id, btc);
    store.addAsset(id, eth);

    store.removeAsset(id, "bitcoin");

    expect(store.watchlists[id].assets).toHaveLength(1);
    expect(store.watchlists[id].assets[0].id).toBe("ethereum");
  });

  it("cascade-removes dashboard widgets when an asset is removed", () => {
    const watchlistStore = useWatchlistStore();
    const dashboardStore = useDashboardStore();

    const wlId = watchlistStore.createWatchlist("Test");
    watchlistStore.addAsset(wlId, btc);

    const dbId = dashboardStore.createDashboard("Main");
    dashboardStore.addWidget(dbId, {
      id: "w1",
      type: "price-card",
      assetId: "bitcoin",
    });
    dashboardStore.addWidget(dbId, {
      id: "w2",
      type: "chart",
      assetId: "bitcoin",
    });
    dashboardStore.addWidget(dbId, {
      id: "w3",
      type: "chart",
      assetId: "ethereum",
    });

    // removing bitcoin should nuke w1 and w2 but keep w3
    watchlistStore.removeAsset(wlId, "bitcoin");

    const db = dashboardStore.dashboards[dbId];
    expect(db.widgets).toHaveLength(1);
    expect(db.widgets[0].id).toBe("w3");
  });

  it("switches active watchlist", () => {
    const store = useWatchlistStore();
    const id1 = store.createWatchlist("A");
    const id2 = store.createWatchlist("B");

    store.setActiveWatchlist(id2);
    expect(store.activeWatchlistId).toBe(id2);
  });

  it("ignores setActiveWatchlist for non-existent id", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("Real");

    store.setActiveWatchlist("fake-id");
    expect(store.activeWatchlistId).toBe(id);
  });

  it("activeWatchlist computed returns the right watchlist", () => {
    const store = useWatchlistStore();
    const id = store.createWatchlist("Active One");
    store.addAsset(id, btc);

    expect(store.activeWatchlist).not.toBeNull();
    expect(store.activeWatchlist!.name).toBe("Active One");
    expect(store.activeWatchlist!.assets).toHaveLength(1);
  });
});
