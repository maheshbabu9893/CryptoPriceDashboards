<template>
  <div class="search-wrapper" ref="wrapperRef">
    <div class="search-input-box" ref="inputBoxRef">
      <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
      <input
        v-model="query"
        type="text"
        placeholder="Search coins..."
        class="search-input"
        @focus="onFocus"
        @input="onInput"
      />
      <v-icon
        v-if="query.length > 0"
        size="16"
        class="clear-icon"
        @click="clearSearch"
        >mdi-close</v-icon
      >
    </div>

    <Teleport to="body">
      <div
        v-if="dropdownVisible"
        class="search-dropdown"
        :style="dropdownPos"
        ref="dropdownRef"
      >
        <div v-if="isSearching" class="dropdown-status">
          <v-progress-circular
            indeterminate
            size="20"
            width="2"
            color="primary"
          />
          <span>Searching...</span>
        </div>
        <div v-else-if="results.length > 0" class="dropdown-results">
          <div
            v-for="coin in results"
            :key="coin.id"
            class="result-item"
            @mousedown.prevent="selectCoin(coin)"
          >
            <img
              v-if="coin.thumb"
              :src="coin.thumb"
              :alt="coin.name"
              class="coin-thumb"
            />
            <div v-else class="coin-thumb-placeholder">
              <v-icon size="14" color="primary">mdi-currency-btc</v-icon>
            </div>
            <span class="coin-name">{{ coin.name }}</span>
            <span class="coin-symbol">{{ coin.symbol.toUpperCase() }}</span>
          </div>
        </div>
        <div v-else class="dropdown-status">No results for "{{ query }}"</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import type { SearchResult } from "@/types";

const router = useRouter();
const query = ref("");
const results = ref<SearchResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const inputBoxRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const rect = ref({ top: 0, left: 0, width: 0 });
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function recalcPosition() {
  if (!inputBoxRef.value) return;
  const r = inputBoxRef.value.getBoundingClientRect();
  const w = 380;
  // right-align dropdown to the input so it doesn't overflow the viewport
  const left = Math.max(8, r.right - w);
  rect.value = {
    top: r.bottom + 6,
    left,
    width: w,
  };
}

const dropdownVisible = computed(
  () => showDropdown.value && query.value.trim().length >= 2,
);

// z-index 100000 — above the custom panel (1006) and scrim (1005)
const dropdownPos = computed(() => ({
  position: "fixed" as const,
  top: rect.value.top + "px",
  left: rect.value.left + "px",
  width: rect.value.width + "px",
  zIndex: 100000,
}));

function onFocus() {
  showDropdown.value = true;
  recalcPosition();
}

function onInput() {
  showDropdown.value = true;
  recalcPosition();
}

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  const trimmed = val?.trim() ?? "";
  if (trimmed.length < 2) {
    results.value = [];
    return;
  }
  debounceTimer = setTimeout(async () => {
    isSearching.value = true;
    try {
      results.value = (await coinGeckoApi.searchCoins(trimmed)).slice(0, 8);
    } catch {
      results.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 350);
});

function selectCoin(coin: SearchResult) {
  showDropdown.value = false;
  query.value = "";
  results.value = [];
  router.push(`/asset/${coin.id}`);
}

function clearSearch() {
  query.value = "";
  results.value = [];
  showDropdown.value = false;
}

// close dropdown when clicking anywhere outside the wrapper or dropdown
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (wrapperRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  showDropdown.value = false;
}

onMounted(() => document.addEventListener("mousedown", onClickOutside, true));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onClickOutside, true),
);
</script>

<style>
.search-dropdown {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  max-height: 360px;
  overflow-y: auto;
}
.dropdown-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  font-size: 13px;
  color: #8898aa;
}
.dropdown-results {
  padding: 6px;
}
.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.result-item:hover {
  background: #f5f7fa;
}
.coin-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.coin-thumb-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.coin-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.coin-symbol {
  font-size: 11px;
  color: #adb5bd;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
</style>

<style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
}
.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f2f5;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  padding: 6px 14px;
  transition: border-color 0.2s;
}
.search-input-box:focus-within {
  border-color: #2dce89;
}
.search-icon {
  color: #8898aa;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #1a1a2e;
  font-size: 14px;
  min-width: 0;
}
.search-input::placeholder {
  color: #adb5bd;
}
.clear-icon {
  color: #adb5bd;
  cursor: pointer;
  flex-shrink: 0;
}
.clear-icon:hover {
  color: #1a1a2e;
}
</style>
