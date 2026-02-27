import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Watchlist, CryptoAsset } from "@/types";
import { useDashboardStore } from "./dashboardStore";

export const useWatchlistStore = defineStore("watchlists", () => {
  const watchlists = ref<Record<string, Watchlist>>({});
  const activeWatchlistId = ref<string | null>(null);

  const activeWatchlist = computed(() => {
    if (!activeWatchlistId.value) return null;
    return watchlists.value[activeWatchlistId.value] ?? null;
  });

  function generateId() {
    return `wl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createWatchlist(name: string): string {
    const id = generateId();
    watchlists.value[id] = { id, name, assets: [] };

    // auto-select if it's the first one
    if (activeWatchlistId.value === null) {
      activeWatchlistId.value = id;
    }

    return id;
  }

  function deleteWatchlist(id: string) {
    delete watchlists.value[id];

    // if we just deleted the active one, pick another or null out
    if (activeWatchlistId.value === id) {
      const remaining = Object.keys(watchlists.value);
      activeWatchlistId.value = remaining.length > 0 ? remaining[0] : null;
    }
  }

  function addAsset(watchlistId: string, asset: CryptoAsset) {
    const wl = watchlists.value[watchlistId];
    if (!wl) return;

    // don't add duplicates
    const alreadyThere = wl.assets.some((a) => a.id === asset.id);
    if (alreadyThere) return;

    wl.assets.push(asset);
  }

  function removeAsset(watchlistId: string, assetId: string) {
    const wl = watchlists.value[watchlistId];
    if (!wl) return;

    wl.assets = wl.assets.filter((a) => a.id !== assetId);

    // cascade: nuke any widgets on the active dashboard that reference this asset
    // calling useDashboardStore() inside the action is fine — Pinia resolves it at runtime
    const dashboardStore = useDashboardStore();

    if (dashboardStore.activeDashboardId) {
      const dashboard =
        dashboardStore.dashboards[dashboardStore.activeDashboardId];
      if (dashboard) {
        const widgetsToRemove = dashboard.widgets
          .filter((w) => w.assetId === assetId)
          .map((w) => w.id);

        for (const widgetId of widgetsToRemove) {
          dashboardStore.removeWidget(
            dashboardStore.activeDashboardId,
            widgetId,
          );
        }
      }
    }
  }

  function setActiveWatchlist(id: string) {
    if (watchlists.value[id]) {
      activeWatchlistId.value = id;
    }
  }

  return {
    watchlists,
    activeWatchlistId,
    activeWatchlist,
    createWatchlist,
    deleteWatchlist,
    addAsset,
    removeAsset,
    setActiveWatchlist,
  };
});
