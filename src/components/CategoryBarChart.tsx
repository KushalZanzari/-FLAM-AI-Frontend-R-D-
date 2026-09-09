import { memo, useEffect, useRef } from "react";
import { useCategoryData, useRegionData, useIsLoading } from "../hooks/useFilteredData";
import { useDashboardStore } from "../store/dashboardStore";
import type { CategoryPoint } from "../types";

// ── Horizontal bar chart using uPlot ─────────────────────────────────────────
// uPlot doesn't natively support horizontal bars, so we render a custom canvas
// using the plugin system for maximum performance.

const CATEGORY_COLORS = [
  "#818cf8", // indigo
  "#fb7185", // rose
  "#34d399", // emerald
  "#f472b6", // pink
  "#fbbf24", // amber
  "#22d3ee", // cyan
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

    const labelColor   = isDark ? "#94a3b8" : "#64748b";
    const bgColor      = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
    const maxRevenue   = Math.max(...data.map((d) => d.revenue));

    const paddingLeft   = 130;
    const paddingRight  = 80;
    const paddingTop    = 10;
    const paddingBottom = 10;
    const barAreaWidth  = width - paddingLeft - paddingRight;
    const itemHeight    = (height - paddingTop - paddingBottom) / data.length;
    const barHeight     = Math.min(itemHeight * 0.55, 32);
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
      ctx.roundRect(paddingLeft, y, barAreaWidth, barHeight, 4);
      ctx.fill();

      // Bar
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, barWidth, barHeight, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Value label
      const rev = item.revenue;
      const revLabel =
        rev >= 1_000_000
          ? `$${(rev / 1_000_000).toFixed(2)}M`
          : `$${(rev / 1_000).toFixed(1)}K`;

      ctx.fillStyle = labelColor;
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
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">
            Revenue by {barChartMode === "category" ? "Category" : "Region"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Canvas-rendered · Sorted by revenue
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setBarChartMode("category")}
            className={`btn-ghost text-xs px-3 py-1 ${
              barChartMode === "category"
                ? "!bg-accent-600/30 !text-accent-400 !border-accent-500/30"
                : ""
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setBarChartMode("region")}
            className={`btn-ghost text-xs px-3 py-1 ${
              barChartMode === "region"
                ? "!bg-accent-600/30 !text-accent-400 !border-accent-500/30"
                : ""
            }`}
          >
            Region
          </button>
        </div>
      </div>

      {isLoading && data.length === 0 ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-white/5 shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          No data matches the current filters
        </div>
      ) : (
        <BarChartCanvas data={data} isDark={isDark} height={chartHeight} />
      )}
    </div>
  );
});
