import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePreferencesStore } from "./preferencesStore";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("preferencesStore", () => {
  it("has sensible defaults", () => {
    const store = usePreferencesStore();
    expect(store.refreshInterval).toBe(30_000);
    expect(store.defaultTimeRange).toBe("7d");
    expect(store.theme).toBe("light");
  });

  it("updates refresh interval", () => {
    const store = usePreferencesStore();
    store.setRefreshInterval(60_000);
    expect(store.refreshInterval).toBe(60_000);
  });

  it("updates default time range", () => {
    const store = usePreferencesStore();
    store.setDefaultTimeRange("30d");
    expect(store.defaultTimeRange).toBe("30d");
  });

  it("toggles theme", () => {
    const store = usePreferencesStore();
    store.setTheme("dark");
    expect(store.theme).toBe("dark");

    store.setTheme("light");
    expect(store.theme).toBe("light");
  });
});
