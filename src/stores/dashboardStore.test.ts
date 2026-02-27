import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useDashboardStore } from "./dashboardStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("dashboardStore", () => {
  it("starts empty", () => {
    const store = useDashboardStore();
    expect(store.dashboards).toEqual({});
    expect(store.activeDashboardId).toBeNull();
  });

  it("creates a dashboard and auto-selects it", () => {
    const store = useDashboardStore();
    const id = store.createDashboard("Main");

    expect(store.dashboards[id].name).toBe("Main");
    expect(store.dashboards[id].widgets).toEqual([]);
    expect(store.dashboards[id].layout).toEqual([]);
    expect(store.activeDashboardId).toBe(id);
  });

  it("deletes a dashboard and picks a new active", () => {
    const store = useDashboardStore();
    const id1 = store.createDashboard("First");
    const id2 = store.createDashboard("Second");

    store.deleteDashboard(id1);

    expect(store.dashboards[id1]).toBeUndefined();
    expect(store.activeDashboardId).toBe(id2);
  });

  it("nulls activeDashboardId when last dashboard is deleted", () => {
    const store = useDashboardStore();
    const id = store.createDashboard("Solo");
    store.deleteDashboard(id);

    expect(store.activeDashboardId).toBeNull();
  });

  it("adds a widget with auto-generated layout", () => {
    const store = useDashboardStore();
    const dbId = store.createDashboard("Test");

    store.addWidget(dbId, {
      id: "w1",
      type: "price-card",
      assetId: "bitcoin",
    });

    expect(store.dashboards[dbId].widgets).toHaveLength(1);
    expect(store.dashboards[dbId].layout).toHaveLength(1);
    expect(store.dashboards[dbId].layout[0].i).toBe("w1");
  });

  it("stacks widgets vertically by default", () => {
    const store = useDashboardStore();
    const dbId = store.createDashboard("Test");

    store.addWidget(dbId, { id: "w1", type: "price-card", assetId: "btc" });
    store.addWidget(dbId, { id: "w2", type: "chart", assetId: "eth" });

    const layout = store.dashboards[dbId].layout;
    // second widget should be below the first
    expect(layout[1].y).toBeGreaterThan(0);
  });

  it("removes a widget and its layout entry", () => {
    const store = useDashboardStore();
    const dbId = store.createDashboard("Test");

    store.addWidget(dbId, { id: "w1", type: "price-card", assetId: "btc" });
    store.addWidget(dbId, { id: "w2", type: "chart", assetId: "eth" });

    store.removeWidget(dbId, "w1");

    expect(store.dashboards[dbId].widgets).toHaveLength(1);
    expect(store.dashboards[dbId].widgets[0].id).toBe("w2");
    expect(store.dashboards[dbId].layout).toHaveLength(1);
    expect(store.dashboards[dbId].layout[0].i).toBe("w2");
  });

  it("updates layout positions", () => {
    const store = useDashboardStore();
    const dbId = store.createDashboard("Test");

    store.addWidget(dbId, { id: "w1", type: "watchlist" });

    const newLayout = [{ i: "w1", x: 2, y: 5, w: 6, h: 4 }];
    store.updateLayout(dbId, newLayout);

    expect(store.dashboards[dbId].layout).toEqual(newLayout);
  });

  it("switches active dashboard", () => {
    const store = useDashboardStore();
    const id1 = store.createDashboard("A");
    const id2 = store.createDashboard("B");

    store.setActiveDashboard(id2);
    expect(store.activeDashboardId).toBe(id2);
  });

  it("ignores setActiveDashboard for non-existent id", () => {
    const store = useDashboardStore();
    const id = store.createDashboard("Real");

    store.setActiveDashboard("nope");
    expect(store.activeDashboardId).toBe(id);
  });

  it("activeDashboard computed works", () => {
    const store = useDashboardStore();
    const id = store.createDashboard("Active");

    expect(store.activeDashboard).not.toBeNull();
    expect(store.activeDashboard!.name).toBe("Active");
  });

  it("does nothing when adding widget to non-existent dashboard", () => {
    const store = useDashboardStore();
    store.addWidget("fake", { id: "w1", type: "watchlist" });
    // no crash, no state change
    expect(Object.keys(store.dashboards)).toHaveLength(0);
  });
});
