import { memo, useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { useTimeSeries, useIsLoading } from "../hooks/useFilteredData";
import { useDashboardStore } from "../store/dashboardStore";
import type { TimeSeriesPoint } from "../types";

// ── uPlot Options Builder ─────────────────────────────────────────────────────
function buildOptions(width: number, isDark: boolean): uPlot.Options {
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#a1a1aa" : "#78716c";

  return {
    width: Math.max(width, 300),
    height: 260,
    cursor: {
      drag: { x: true, y: false, uni: 50 },
    },
    legend: { show: true },
    scales: {
      x: { time: true },
      y: { auto: true },
    },
    axes: [
      {
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: "transparent" },
        font: "11px Inter, system-ui, sans-serif",
      },
      {
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: "transparent" },
        font: "11px Inter, system-ui, sans-serif",
        values: (_self: uPlot, vals: (number | null)[]) =>
          vals.map((v) =>
            v == null
              ? ""
              : v >= 1_000_000
              ? `$${(v / 1_000_000).toFixed(1)}M`
              : v >= 1_000
              ? `$${(v / 1_000).toFixed(0)}K`
              : `$${v}`
          ),
      },
    ],
    series: [
      {},
      {
        label: "Revenue",
        stroke: "#f59e0b",
        fill: "rgba(245, 158, 11, 0.08)",
        width: 2,
        spanGaps: true,
      },
    ],
  };
}

// ── Data Transformation ───────────────────────────────────────────────────────
function toUPlotData(
  timeSeries: TimeSeriesPoint[]
): [number[], number[]] {
  if (!timeSeries.length) return [[], []];
  const timestamps = timeSeries.map((p) => p.timestamp);
  const revenues   = timeSeries.map((p) => p.revenue);
  return [timestamps, revenues];
}

// ── Component ─────────────────────────────────────────────────────────────────
export const RevenueLineChart = memo(function RevenueLineChart() {
  const timeSeries = useTimeSeries();
  const isLoading  = useIsLoading();
  const theme      = useDashboardStore((s) => s.theme);

  const cardRef      = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef      = useRef<uPlot | null>(null);
  const isDark       = theme === "dark";

  const getCardContentWidth = () => {
    if (!cardRef.current) return 500;
    // card has p-5 (20px left + 20px right = 40px)
    const cw = cardRef.current.clientWidth - 40;
    return Math.max(cw, 300);
  };

  // ── Create/destroy uPlot on mount ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const width = getCardContentWidth();
    const opts  = buildOptions(width, isDark);
    const [ts, rev] = toUPlotData(timeSeries);

    plotRef.current = new uPlot(opts, [ts, rev], containerRef.current);

    const raf = requestAnimationFrame(() => {
      if (plotRef.current) {
        const w = getCardContentWidth();
        plotRef.current.setSize({ width: w, height: 260 });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]); // Recreate when theme changes

  // ── Update data & ensure sizing ──────────────────────────────────────────
  useEffect(() => {
    if (!plotRef.current) return;
    const [ts, rev] = toUPlotData(timeSeries);
    plotRef.current.setData([ts, rev]);

    const w = getCardContentWidth();
    plotRef.current.setSize({ width: w, height: 260 });
  }, [timeSeries]);

  // ── Resize observer on the parent card ──────────────────────────────────
  useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        if (plotRef.current && width > 100) {
          plotRef.current.setSize({ width, height: 260 });
        }
      }
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="chart-container min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-stone-900 dark:text-stone-200 text-sm">
            Revenue Over Time
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Monthly timeline · Canvas-accelerated (uPlot)
          </p>
        </div>
        {isLoading && (
          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium animate-pulse">
            Updating…
          </span>
        )}
      </div>

      {timeSeries.length === 0 && !isLoading ? (
        <div className="h-64 flex items-center justify-center text-stone-400 text-sm">
          No data matches the current filters
        </div>
      ) : (
        <div
          ref={containerRef}
          className="uplot-wrap w-full overflow-hidden"
          style={{ minHeight: 260 }}
        />
      )}
    </div>
  );
});
