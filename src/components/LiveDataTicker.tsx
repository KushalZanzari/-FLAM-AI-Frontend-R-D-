import { memo, useEffect, useRef, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import type { SaleRow } from "../types";

const ALL_REGIONS   = ["North America", "Europe", "Asia Pacific", "Latin America"];
const ALL_CATEGORIES = ["Electronics", "Apparel", "Home & Garden", "Beauty", "Sports", "Food & Grocery"];
const ALL_SEGMENTS  = ["Consumer", "Corporate", "Home Office", "Small Business"];
const PRODUCTS: Record<string, string[]> = {
  Electronics: ["Laptop Pro 15", "Wireless Earbuds X", "Smart Watch Ultra"],
  Apparel: ["Running Shoes V3", "Yoga Pants Elite", "Winter Jacket Pro"],
  "Home & Garden": ["Air Purifier HEPA", "Robot Vacuum X10", "Smart Thermostat"],
  Beauty: ["Vitamin C Serum", "Retinol Moisturizer", "SPF 50 Sunscreen"],
  Sports: ["Yoga Mat Premium", "Resistance Bands Set", "Adjustable Dumbbells"],
  "Food & Grocery": ["Protein Powder Whey", "Organic Green Tea 100", "Mixed Nuts 1kg"],
};

let liveIdCounter = 300_001;

function generateLiveRow(): SaleRow {
  const category = ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
  const product  = PRODUCTS[category][Math.floor(Math.random() * PRODUCTS[category].length)];
  return {
    id: liveIdCounter++,
    date: new Date().toISOString().split("T")[0],
    region: ALL_REGIONS[Math.floor(Math.random() * ALL_REGIONS.length)],
    category,
    product_name: product,
    revenue: Math.round(Math.random() * 900 * 100) / 100 + 50,
    units_sold: Math.floor(Math.random() * 10) + 1,
    customer_segment: ALL_SEGMENTS[Math.floor(Math.random() * ALL_SEGMENTS.length)],
  };
}

/**
 * LiveDataTicker — simulates new transactions arriving every 1.5s.
 * Appends rows directly to the Zustand store without triggering
 * a full re-filter in the worker (lightweight optimistic update).
 */
export const LiveDataTicker = memo(function LiveDataTicker() {
  const liveDataEnabled = useDashboardStore((s) => s.liveDataEnabled);
  const toggleLiveData  = useDashboardStore((s) => s.toggleLiveData);
  const appendLiveRow   = useDashboardStore((s) => s.appendLiveRow);
  const [recentRows, setRecentRows] = useState<SaleRow[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (liveDataEnabled) {
      intervalRef.current = setInterval(() => {
        const row = generateLiveRow();
        appendLiveRow(row);
        setRecentRows((prev) => [row, ...prev].slice(0, 5));
      }, 1500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRecentRows([]);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [liveDataEnabled, appendLiveRow]);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {liveDataEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <h3 className="font-medium text-stone-900 dark:text-stone-200 text-sm">
            Live Stream
          </h3>
          <span className="chip text-[10px]">Real-time Feed</span>
        </div>
        <button
          onClick={toggleLiveData}
          className={liveDataEnabled ? "btn-ghost text-xs !text-rose-600 dark:!text-rose-400 !border-rose-500/30" : "btn-primary text-xs"}
        >
          {liveDataEnabled ? "⏹ Pause Stream" : "▶ Start Stream"}
        </button>
      </div>

      {liveDataEnabled && recentRows.length > 0 && (
        <div className="space-y-1.5">
          {recentRows.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-lg transition-all
                ${i === 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-stone-50 dark:bg-surface-800/60 border border-stone-200 dark:border-surface-700/50"}`}
            >
              <span className="text-stone-400 dark:text-stone-500 font-mono">#{row.id}</span>
              <span className="text-stone-800 dark:text-stone-200 font-medium">{row.product_name}</span>
              <span className="text-stone-500 dark:text-stone-400">{row.region}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                ${row.revenue.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!liveDataEnabled && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Simulates live transactional event streaming at 1.5s intervals.
          State aggregates update without requiring a blocking worker refilter.
        </p>
      )}
    </div>
  );
});
