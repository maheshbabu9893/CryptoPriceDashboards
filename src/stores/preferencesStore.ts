import { defineStore } from "pinia";
import { ref } from "vue";
import type { TimeRange } from "@/types";

export const usePreferencesStore = defineStore("preferences", () => {
  const refreshInterval = ref(30_000); // 30s
  const defaultTimeRange = ref<TimeRange>("7d");
  const theme = ref<"light" | "dark">("light");

  function setRefreshInterval(ms: number) {
    refreshInterval.value = ms;
  }

  function setDefaultTimeRange(range: TimeRange) {
    defaultTimeRange.value = range;
  }

  function setTheme(newTheme: "light" | "dark") {
    theme.value = newTheme;
  }

  return {
    refreshInterval,
    defaultTimeRange,
    theme,
    setRefreshInterval,
    setDefaultTimeRange,
    setTheme,
  };
});
