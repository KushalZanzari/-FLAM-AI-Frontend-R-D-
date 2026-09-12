import { memo, useEffect, useRef } from "react";
import { useCategoryData, useRegionData, useIsLoading } from "../hooks/useFilteredData";
import { useDashboardStore } from "../store/dashboardStore";
import type { CategoryPoint } from "../types";

// ── Horizontal bar chart using uPlot ─────────────────────────────────────────
// uPlot doesn't natively support horizontal bars, so we render a custom canvas
// using the plugin system for maximum performance.

const CATEGORY_COLORS = [
  "#f59e0b", // Warm Amber
  "#ea580c", // Terracotta
  "#10b981", // Forest Emerald
  "#e11d48", // Crimson Rose
  "#d97706", // Deep Ochre
  "#84cc16", // Warm Sage
];

// ── Custom bar chart renderer using Canvas 2D ─────────────────────────────────
interface BarChartCanvasProps {
  data: CategoryPoint[];
  isDark: boolean;
  height: number;
}

function BarChartCanvas({ data, isDark, height }: BarChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    canvas.width  = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const labelColor   = isDark ? "#a1a1aa" : "#57534e";
    const valueColor   = isDark ? "#d4d4d8" : "#292524";
    const bgColor      = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    const maxRevenue   = Math.max(...data.map((d) => d.revenue));

    const paddingLeft   = 130;
    const paddingRight  = 80;
    const paddingTop    = 10;
    const paddingBottom = 10;
    const barAreaWidth  = width - paddingLeft - paddingRight;
    const itemHeight    = (height - paddingTop - paddingBottom) / data.length;
    const barHeight     = Math.min(itemHeight * 0.52, 28);
    const barGap        = itemHeight - barHeight;

    ctx.font = "12px Inter, system-ui, sans-serif";

    data.forEach((item, i) => {
      const y = paddingTop + i * itemHeight + barGap / 2;
      const barWidth = (item.revenue / maxRevenue) * barAreaWidth;
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

      // Label
      ctx.fillStyle = labelColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label = item.label.length > 16 ? item.label.slice(0, 14) + "…" : item.label;
      ctx.fillText(label, paddingLeft - 10, y + barHeight / 2);

      // Background track
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, barAreaWidth, barHeight, 3);
      ctx.fill();

      // Bar
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, barWidth, barHeight, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Value label
      const rev = item.revenue;
      const revLabel =
        rev >= 1_000_000
          ? `$${(rev / 1_000_000).toFixed(2)}M`
          : `$${(rev / 1_000).toFixed(1)}K`;

      ctx.fillStyle = valueColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(revLabel, paddingLeft + barWidth + 8, y + barHeight / 2);
    });
  }, [data, isDark, height]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const CategoryBarChart = memo(function CategoryBarChart() {
  const categoryData = useCategoryData();
  const regionData   = useRegionData();
  const isLoading    = useIsLoading();
  const barChartMode = useDashboardStore((s) => s.barChartMode);
  const setBarChartMode = useDashboardStore((s) => s.setBarChartMode);
  const theme        = useDashboardStore((s) => s.theme);
  const isDark       = theme === "dark";

  const data = barChartMode === "category" ? categoryData : regionData;
  const chartHeight = Math.max(data.length * 48, 200);

  return (
    <div className="chart-container min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-stone-900 dark:text-stone-200 text-sm">
            Revenue by {barChartMode === "category" ? "Category" : "Region"}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Distribution sorted by aggregate revenue
          </p>
        </div>
        <div className="flex gap-1 bg-stone-100 dark:bg-surface-800 p-0.5 rounded-lg border border-stone-200 dark:border-surface-700">
          <button
            onClick={() => setBarChartMode("category")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              barChartMode === "category"
                ? "bg-white dark:bg-surface-700 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-surface-600"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setBarChartMode("region")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              barChartMode === "region"
                ? "bg-white dark:bg-surface-700 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-surface-600"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            Region
          </button>
        </div>
      </div>

      {isLoading && data.length === 0 ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 rounded bg-stone-200 dark:bg-surface-800/60 shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-stone-400 text-sm">
          No data matches the current filters
        </div>
      ) : (
        <BarChartCanvas data={data} isDark={isDark} height={chartHeight} />
      )}
    </div>
  );
});
