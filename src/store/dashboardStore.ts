import { create } from "zustand";
import type {
  FilterState,
  SummaryStats,
  TimeSeriesPoint,
  CategoryPoint,
  ScatterPoint,
  SaleRow,
  WorkerResult,
  BarChartMode,
  Theme,
  DataGranularity,
} from "../types";
import { DEFAULT_FILTERS } from "../types";

interface DashboardState {
  // ── Worker ────────────────────────────────────────────────────────────────
  worker: Worker | null;
  workerReady: boolean;
  totalRows: number;
  setWorker: (w: Worker) => void;
  setWorkerReady: (ready: boolean, totalRows?: number) => void;

  // ── Filters ───────────────────────────────────────────────────────────────
  filters: FilterState;
  setFilters: (partial: Partial<FilterState>) => void;
  resetFilters: () => void;

  // ── Results (from worker) ─────────────────────────────────────────────────
  isLoading: boolean;
  loadingCsv: boolean;
  summaryStats: SummaryStats | null;
  timeSeries: TimeSeriesPoint[];
  categoryData: CategoryPoint[];
  regionData: CategoryPoint[];
  scatterData: ScatterPoint[];
  filteredRows: SaleRow[];
  filteredCount: number;
  lastProcessingMs: number;
  setLoading: (v: boolean) => void;
  setCsvLoading: (v: boolean) => void;
  applyWorkerResult: (result: WorkerResult) => void;

  // ── UI State ──────────────────────────────────────────────────────────────
  barChartMode: BarChartMode;
  setBarChartMode: (mode: BarChartMode) => void;

  theme: Theme;
  toggleTheme: () => void;

  granularity: DataGranularity;
  setGranularity: (g: DataGranularity) => void;

  liveDataEnabled: boolean;
  toggleLiveData: () => void;

  // ── Live data ticker ──────────────────────────────────────────────────────
  appendLiveRow: (row: SaleRow) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Worker
  worker: null,
  workerReady: false,
  totalRows: 0,
  setWorker: (w) => set({ worker: w }),
  setWorkerReady: (ready, totalRows) =>
    set({ workerReady: ready, totalRows: totalRows ?? get().totalRows }),

  // Filters
  filters: DEFAULT_FILTERS,
  setFilters: (partial) => {
    const newFilters = { ...get().filters, ...partial };
    set({ filters: newFilters, isLoading: true });

    // Dispatch to worker
    const { worker, workerReady } = get();
    if (worker && workerReady) {
      worker.postMessage({ type: "FILTER", filters: newFilters });
    }
  },
  resetFilters: () => {
    const { worker, workerReady } = get();
    set({ filters: DEFAULT_FILTERS, isLoading: true });
    if (worker && workerReady) {
      worker.postMessage({ type: "FILTER", filters: DEFAULT_FILTERS });
    }
  },

  // Results
  isLoading: true,
  loadingCsv: true,
  summaryStats: null,
  timeSeries: [],
  categoryData: [],
  regionData: [],
  scatterData: [],
  filteredRows: [],
  filteredCount: 0,
  lastProcessingMs: 0,
  setLoading: (v) => set({ isLoading: v }),
  setCsvLoading: (v) => set({ loadingCsv: v }),
  applyWorkerResult: (result) =>
    set({
      summaryStats: result.summaryStats,
      timeSeries: result.timeSeries,
      categoryData: result.categoryData,
      regionData: result.regionData,
      scatterData: result.scatterData,
      filteredRows: result.filteredRows,
      filteredCount: result.filteredCount,
      lastProcessingMs: result.processingMs,
      isLoading: false,
    }),

  // UI state
  barChartMode: "category",
  setBarChartMode: (mode) => set({ barChartMode: mode }),

  theme: "dark",
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      return { theme: next };
    }),

  granularity: "monthly",
  setGranularity: (g) => set({ granularity: g }),

  liveDataEnabled: false,
  toggleLiveData: () => set((s) => ({ liveDataEnabled: !s.liveDataEnabled })),

  // Live data: append a row and re-trigger filtering
  appendLiveRow: (row) => {
    // We can't directly modify worker's dataset, so we just append to filteredRows
    // for a lightweight "new transaction arrived" effect
    set((s) => ({
      filteredRows: [row, ...s.filteredRows],
      filteredCount: s.filteredCount + 1,
      summaryStats: s.summaryStats
        ? {
            ...s.summaryStats,
            totalRevenue:
              Math.round((s.summaryStats.totalRevenue + row.revenue) * 100) /
              100,
            totalUnits: s.summaryStats.totalUnits + row.units_sold,
            transactionCount: s.summaryStats.transactionCount + 1,
            avgOrderValue:
              Math.round(
                ((s.summaryStats.totalRevenue + row.revenue) /
                  (s.summaryStats.transactionCount + 1)) *
                  100
              ) / 100,
          }
        : null,
    }));
  },
}));
