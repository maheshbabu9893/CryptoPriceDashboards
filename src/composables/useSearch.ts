import { ref, watch } from "vue";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import type { SearchResult } from "@/types";

export function useSearch() {
  const query = ref("");
  const results = ref<SearchResult[]>([]);
  const isSearching = ref(false);
  const error = ref<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(query, (value) => {
    // clear any pending search
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // need at least 2 characters to search
    if (value.trim().length < 2) {
      results.value = [];
      error.value = null;
      return;
    }

    // debounce 300ms before hitting the API
    debounceTimer = setTimeout(() => {
      performSearch(value.trim());
    }, 300);
  });

  async function performSearch(searchTerm: string) {
    isSearching.value = true;
    error.value = null;

    try {
      results.value = await coinGeckoApi.searchCoins(searchTerm);
    } catch (err) {
      console.warn("Search failed:", err);
      error.value = "Search failed. Please try again.";
      results.value = [];
    } finally {
      isSearching.value = false;
    }
  }

  return {
    query,
    results,
    isSearching,
    error,
  };
}
