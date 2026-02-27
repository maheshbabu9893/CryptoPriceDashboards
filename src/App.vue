<template>
  <v-app>
    <v-app-bar
      flat
      color="white"
      height="56"
      class="top-bar px-4"
      style="z-index: 1010"
    >
      <router-link
        to="/"
        class="d-flex align-center text-decoration-none gap-2"
      >
        <v-icon color="primary" size="22">mdi-chart-line-variant</v-icon>
        <span class="app-title">CryptoTracker</span>
      </router-link>
      <v-spacer />
      <div style="width: 260px"><SearchBar /></div>
    </v-app-bar>

    <v-main class="main-bg"><router-view /></v-main>

    <!-- custom slide panel — no vuetify drawer, no scrim blocking search -->
    <Teleport to="body">
      <transition name="panel-fade">
        <div v-if="showPanel" class="panel-scrim" @click="closePanel" />
      </transition>
      <div class="panel-drawer" :class="{ open: showPanel }">
        <div class="panel-inner">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center" style="gap: 10px">
              <v-icon color="primary" size="24">mdi-chart-line</v-icon>
              <span class="panel-coin-name">{{ panelCoin }}</span>
            </div>
            <v-btn icon variant="text" size="small" @click="closePanel">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
          <div v-if="panelMarket" class="mb-5">
            <div class="panel-price">
              ${{ fmtPrice(panelMarket.currentPrice) }}
            </div>
            <div class="d-flex align-center mt-2" style="gap: 10px">
              <v-chip
                :color="
                  panelMarket.priceChangePercentage24h >= 0
                    ? 'success'
                    : 'error'
                "
                size="small"
                variant="flat"
                label
              >
                {{ panelMarket.priceChangePercentage24h >= 0 ? "+" : ""
                }}{{ panelMarket.priceChangePercentage24h.toFixed(2) }}%
              </v-chip>
              <span style="font-size: 13px; color: #8898aa">24h change</span>
            </div>
            <div style="font-size: 14px; color: #8898aa; margin-top: 8px">
              Market Cap: ${{ fmtCap(panelMarket.marketCap) }}
            </div>
          </div>
          <v-divider class="mb-5" />
          <ChartWidget v-if="showPanel" :asset-id="panelCoin" />
          <v-btn
            block
            color="primary"
            variant="flat"
            rounded="lg"
            class="mt-5"
            :to="`/asset/${panelCoin}`"
            @click="closePanel"
          >
            View Details <v-icon end size="16">mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </div>
    </Teleport>
  </v-app>
</template>

<script setup lang="ts">
import { useChartPanel } from "@/composables/useChartPanel";
import SearchBar from "@/components/SearchBar.vue";
import ChartWidget from "@/components/ChartWidget.vue";

const { showPanel, panelCoin, panelMarket, closePanel } = useChartPanel();

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function fmtCap(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString("en-US");
}
</script>

<style scoped>
.top-bar {
  border-bottom: 1px solid #edf0f5 !important;
}
.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}
.main-bg {
  background: #f5f7fa;
}
.panel-coin-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  text-transform: capitalize;
}
.panel-price {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}
</style>

<style>
.panel-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1005;
}
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.25s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
.panel-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  z-index: 1011;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.panel-drawer.open {
  transform: translateX(0);
}
.panel-inner {
  padding: 28px 24px;
  height: 100vh;
  overflow-y: auto;
}
</style>
