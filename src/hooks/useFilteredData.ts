import { useDashboardStore } from "../store/dashboardStore";

/**
 * useFilteredData — memoized selectors for chart/table components.
 * Each component subscribes only to the slice it needs,
 * preventing re-renders when unrelated state changes.
 */

export const useSummaryStats = () =>
  useDashboardStore((s) => s.summaryStats);

export const useTimeSeries = () =>
  useDashboardStore((s) => s.timeSeries);

export const useCategoryData = () =>
  useDashboardStore((s) => s.categoryData);

export const useRegionData = () =>
  useDashboardStore((s) => s.regionData);

export const useScatterData = () =>
  useDashboardStore((s) => s.scatterData);

export const useFilteredRows = () =>
  useDashboardStore((s) => s.filteredRows);

export const useFilteredCount = () =>
  useDashboardStore((s) => s.filteredCount);

export const useFilters = () =>
  useDashboardStore((s) => s.filters);

export const useIsLoading = () =>
  useDashboardStore((s) => s.isLoading);

export const useLoadingCsv = () =>
  useDashboardStore((s) => s.loadingCsv);

export const useLastProcessingMs = () =>
  useDashboardStore((s) => s.lastProcessingMs);

export const useBarChartMode = () =>
  useDashboardStore((s) => s.barChartMode);

export const useTheme = () =>
  useDashboardStore((s) => s.theme);

export const useTotalRows = () =>
  useDashboardStore((s) => s.totalRows);
