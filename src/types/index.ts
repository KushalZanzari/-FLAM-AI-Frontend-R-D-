// ── Core Data Types ──────────────────────────────────────────────────────────

export interface SaleRow {
  id: number;
  date: string; // ISO: "2022-03-15"
  region: string;
  category: string;
  product_name: string;
  revenue: number;
  units_sold: number;
  customer_segment: string;
}

// ── Filter State ─────────────────────────────────────────────────────────────

export interface FilterState {
  dateFrom: string; // ISO date string, e.g. "2022-01-01"
  dateTo: string;
  regions: string[];
  categories: string[];
  customerSegments: string[];
  productSearch: string;
}

export const DEFAULT_FILTERS: FilterState = {
  dateFrom: "2022-01-01",
  dateTo: "2024-12-31",
  regions: [],
  categories: [],
  customerSegments: [],
  productSearch: "",
};

// ── Aggregated / Chart Data ───────────────────────────────────────────────────

export interface SummaryStats {
  totalRevenue: number;
  totalUnits: number;
  avgOrderValue: number;
  transactionCount: number;
}

export interface TimeSeriesPoint {
  timestamp: number; // Unix seconds (for uPlot)
  revenue: number;
  units: number;
}

export interface CategoryPoint {
  label: string;
  revenue: number;
  units: number;
}

export interface ScatterPoint {
  x: number; // units_sold
  y: number; // revenue
  category: string;
}

// ── Worker Messages ──────────────────────────────────────────────────────────

export type WorkerInMessage =
  | { type: "INIT"; csvText: string }
  | { type: "FILTER"; filters: FilterState };

export interface WorkerResult {
  summaryStats: SummaryStats;
  timeSeries: TimeSeriesPoint[];
  categoryData: CategoryPoint[];
  regionData: CategoryPoint[];
  scatterData: ScatterPoint[];
  filteredRows: SaleRow[];
  filteredCount: number;
  processingMs: number;
}

export type WorkerOutMessage =
  | { type: "READY"; totalRows: number }
  | { type: "RESULT"; result: WorkerResult }
  | { type: "ERROR"; message: string };

// ── UI State ─────────────────────────────────────────────────────────────────

export type BarChartMode = "category" | "region";
export type Theme = "dark" | "light";
export type DataGranularity = "daily" | "weekly" | "monthly";

// ── Reference Data (static, used in FilterPanel) ─────────────────────────────

export const ALL_REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
];

export const ALL_CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home & Garden",
  "Beauty",
  "Sports",
  "Food & Grocery",
];

export const ALL_SEGMENTS = [
  "Consumer",
  "Corporate",
  "Home Office",
  "Small Business",
];
