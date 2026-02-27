import { ref, computed } from "vue";
import { usePriceStore } from "@/stores/priceStore";

const showPanel = ref(false);
const panelCoin = ref("bitcoin");

export function useChartPanel() {
  const priceStore = usePriceStore();
  const panelMarket = computed(
    () => priceStore.prices[panelCoin.value] ?? null,
  );

  function openPanel(coinId: string) {
    panelCoin.value = coinId;
    showPanel.value = true;
  }

  function closePanel() {
    showPanel.value = false;
  }

  return {
    showPanel,
    panelCoin,
    panelMarket,
    openPanel,
    closePanel,
  };
}
