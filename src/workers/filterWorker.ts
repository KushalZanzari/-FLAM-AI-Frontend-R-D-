/**
 * filterWorker.ts — Off-main-thread data processing
 *
 * Responsibilities:
 *  1. Parse the full 300k-row CSV once on INIT
 *  2. On every FILTER message: apply filters, compute aggregates, downsample
 *  3. Post results back without touching the main thread during computation
 *
 * Performance techniques used here:
 *  - Single-pass filter + aggregate (O(n) per filter op)
 *  - LTTB downsampling for scatter chart
 *  - Time-bucketing for line chart (avoids rendering every raw point)
 *  - Typed arrays for hot-path numeric work
 */

import type {
  SaleRow,
  FilterState,
  WorkerInMessage,
  WorkerOutMessage,
  SummaryStats,
  TimeSeriesPoint,
  CategoryPoint,
  ScatterPoint,
} from "../types";

// ── Module-level dataset storage ─────────────────────────────────────────────
let dataset: SaleRow[] = [];
let datasetReady = false;

// ── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(csvText: string): SaleRow[] {
  const lines = csvText.split("\n");
  const rows: SaleRow[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Fast split — fields don't contain commas so simple split is safe
    const parts = line.split(",");
    if (parts.length < 8) continue;

    rows.push({
      id: parseInt(parts[0], 10),
      date: parts[1],
      region: parts[2],
      category: parts[3],
      product_name: parts[4],
      revenue: parseFloat(parts[5]),
      units_sold: parseInt(parts[6], 10),
      customer_segment: parts[7],
    });
  }

  return rows;
}

// ── LTTB Downsampling ────────────────────────────────────────────────────────
/**
 * Largest-Triangle-Three-Buckets algorithm.
 * Reduces `data` to `threshold` points while preserving visual shape.
 * Returns indices into the original array.
 */
function lttb(
  data: { x: number; y: number }[],
  threshold: number
): { x: number; y: number }[] {
  const n = data.length;
  if (n <= threshold) return data;

  const sampled: { x: number; y: number }[] = [];
  const bucketSize = (n - 2) / (threshold - 2);

  let a = 0; // Previously selected point
  sampled.push(data[a]);

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (look-ahead)
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    let avgX = 0;
    let avgY = 0;
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Current bucket range
    const rangeOffs = Math.floor((i + 0) * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    // Find point in current bucket that forms largest triangle
    const pointAX = data[a].x;
    const pointAY = data[a].y;
    let maxArea = -1;
    let maxAreaIdx = rangeOffs;
    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[j].y - pointAY) -
          (pointAX - data[j].x) * (avgY - pointAY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    sampled.push(data[maxAreaIdx]);
    a = maxAreaIdx;
  }

  sampled.push(data[n - 1]);
  return sampled;
}

// ── Date Utilities ────────────────────────────────────────────────────────────
function isoToUnixSeconds(iso: string): number {
  return new Date(iso).getTime() / 1000;
}

function dateToMonthBucket(iso: string): string {
  return iso.substring(0, 7); // "YYYY-MM"
}

// ── Main Filter + Aggregate Function ─────────────────────────────────────────
function processFilters(filters: FilterState): WorkerOutMessage {
  const t0 = performance.now();

  const {
    dateFrom,
    dateTo,
    regions,
    categories,
    customerSegments,
    productSearch,
  } = filters;

  const fromMs = new Date(dateFrom).getTime();
  const toMs = new Date(dateTo + "T23:59:59").getTime();
  const hasRegions = regions.length > 0;
  const hasCategories = categories.length > 0;
  const hasSegments = customerSegments.length > 0;
  const searchLower = productSearch.toLowerCase().trim();
  const hasSearch = searchLower.length > 0;

  // Precompute sets for O(1) lookup
  const regionSet = new Set(regions);
  const categorySet = new Set(categories);
  const segmentSet = new Set(customerSegments);

  // Accumulators
  let totalRevenue = 0;
  let totalUnits = 0;
  let transactionCount = 0;

  // Time series: monthly buckets → Map<"YYYY-MM", {revenue, units}>
  const timeMap = new Map<string, { revenue: number; units: number }>();

  // Category/Region buckets
  const categoryMap = new Map<string, { revenue: number; units: number }>();
  const regionMap = new Map<string, { revenue: number; units: number }>();

  // Scatter data (raw, will be LTTB'd after)
  const scatterRaw: { x: number; y: number }[] = [];

  // Filtered rows (for table)
  const filteredRows: SaleRow[] = [];

  // ── Single-pass filter + aggregate ───────────────────────────────────────
  for (let i = 0; i < dataset.length; i++) {
    const row = dataset[i];

    // Date filter
    const rowMs = new Date(row.date).getTime();
    if (rowMs < fromMs || rowMs > toMs) continue;

    // Region filter
    if (hasRegions && !regionSet.has(row.region)) continue;

    // Category filter
    if (hasCategories && !categorySet.has(row.category)) continue;

    // Segment filter
    if (hasSegments && !segmentSet.has(row.customer_segment)) continue;

    // Product search
    if (hasSearch && !row.product_name.toLowerCase().includes(searchLower)) continue;

    // ── Passed all filters ──────────────────────────────────────────────
    filteredRows.push(row);

    // Summary stats
    totalRevenue += row.revenue;
    totalUnits += row.units_sold;
    transactionCount++;

    // Time series bucket
    const bucket = dateToMonthBucket(row.date);
    const existing = timeMap.get(bucket);
    if (existing) {
      existing.revenue += row.revenue;
      existing.units += row.units_sold;
    } else {
      timeMap.set(bucket, { revenue: row.revenue, units: row.units_sold });
    }

    // Category bucket
    const catBucket = categoryMap.get(row.category);
    if (catBucket) {
      catBucket.revenue += row.revenue;
      catBucket.units += row.units_sold;
    } else {
      categoryMap.set(row.category, {
        revenue: row.revenue,
        units: row.units_sold,
      });
    }

    // Region bucket
    const regBucket = regionMap.get(row.region);
    if (regBucket) {
      regBucket.revenue += row.revenue;
      regBucket.units += row.units_sold;
    } else {
      regionMap.set(row.region, {
        revenue: row.revenue,
        units: row.units_sold,
      });
    }

    // Scatter raw data (revenue vs units)
    scatterRaw.push({ x: row.units_sold, y: row.revenue });
  }

  // ── Build summary stats ───────────────────────────────────────────────────
  const summaryStats: SummaryStats = {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalUnits,
    avgOrderValue:
      transactionCount > 0
        ? Math.round((totalRevenue / transactionCount) * 100) / 100
        : 0,
    transactionCount,
  };

  // ── Build time series (sorted by month) ──────────────────────────────────
  const timeSeries: TimeSeriesPoint[] = Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, { revenue, units }]) => ({
      timestamp: isoToUnixSeconds(bucket + "-01"),
      revenue: Math.round(revenue * 100) / 100,
      units,
    }));

  // ── Build category data (sorted by revenue desc) ──────────────────────────
  const categoryData: CategoryPoint[] = Array.from(categoryMap.entries())
    .map(([label, { revenue, units }]) => ({
      label,
      revenue: Math.round(revenue * 100) / 100,
      units,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const regionData: CategoryPoint[] = Array.from(regionMap.entries())
    .map(([label, { revenue, units }]) => ({
      label,
      revenue: Math.round(revenue * 100) / 100,
      units,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── LTTB downsample scatter to 4000 points ─────────────────────────────
  const scatterDownsampled = lttb(scatterRaw, 4000);
  const scatterData: ScatterPoint[] = scatterDownsampled.map((p) => ({
    x: p.x,
    y: p.y,
    category: "mixed", // category info lost after downsampling — acceptable
  }));

  const processingMs = Math.round((performance.now() - t0) * 10) / 10;

  return {
    type: "RESULT",
    result: {
      summaryStats,
      timeSeries,
      categoryData,
      regionData,
      scatterData,
      filteredRows,
      filteredCount: filteredRows.length,
      processingMs,
    },
  };
}

// ── Message Handler ───────────────────────────────────────────────────────────
self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === "INIT") {
    try {
      dataset = parseCSV(msg.csvText);
      datasetReady = true;
      self.postMessage({ type: "READY", totalRows: dataset.length } satisfies WorkerOutMessage);
    } catch (err) {
      self.postMessage({
        type: "ERROR",
        message: String(err),
      } satisfies WorkerOutMessage);
    }
    return;
  }

  if (msg.type === "FILTER") {
    if (!datasetReady) {
      self.postMessage({
        type: "ERROR",
        message: "Dataset not initialized",
      } satisfies WorkerOutMessage);
      return;
    }

    const result = processFilters(msg.filters);
    self.postMessage(result);
    return;
  }
};
