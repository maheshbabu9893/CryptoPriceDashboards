import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Dashboard, WidgetConfig, LayoutItem } from "@/types";

export const useDashboardStore = defineStore("dashboards", () => {
  const dashboards = ref<Record<string, Dashboard>>({});
  const activeDashboardId = ref<string | null>(null);

  const activeDashboard = computed(() => {
    if (!activeDashboardId.value) return null;
    return dashboards.value[activeDashboardId.value] ?? null;
  });

  function generateId() {
    return `db-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createDashboard(name: string): string {
    const id = generateId();
    dashboards.value[id] = { id, name, widgets: [], layout: [] };

    // auto-select the first dashboard
    if (activeDashboardId.value === null) {
      activeDashboardId.value = id;
    }

    return id;
  }

  function deleteDashboard(id: string) {
    delete dashboards.value[id];

    if (activeDashboardId.value === id) {
      const remaining = Object.keys(dashboards.value);
      activeDashboardId.value = remaining.length > 0 ? remaining[0] : null;
    }
  }

  function addWidget(dashboardId: string, widget: WidgetConfig) {
    const db = dashboards.value[dashboardId];
    if (!db) return;

    db.widgets.push(widget);

    // give it a default layout position — stack below existing widgets
    const maxY = db.layout.reduce(
      (max, item) => Math.max(max, item.y + item.h),
      0,
    );
    db.layout.push({
      i: widget.id,
      x: 0,
      y: maxY,
      w: 4,
      h: 3,
    });
  }

  function removeWidget(dashboardId: string, widgetId: string) {
    const db = dashboards.value[dashboardId];
    if (!db) return;

    db.widgets = db.widgets.filter((w) => w.id !== widgetId);
    db.layout = db.layout.filter((l) => l.i !== widgetId);
  }

  function updateLayout(dashboardId: string, layout: LayoutItem[]) {
    const db = dashboards.value[dashboardId];
    if (!db) return;

    db.layout = layout;
  }

  function setActiveDashboard(id: string) {
    if (dashboards.value[id]) {
      activeDashboardId.value = id;
    }
  }

  return {
    dashboards,
    activeDashboardId,
    activeDashboard,
    createDashboard,
    deleteDashboard,
    addWidget,
    removeWidget,
    updateLayout,
    setActiveDashboard,
  };
});
