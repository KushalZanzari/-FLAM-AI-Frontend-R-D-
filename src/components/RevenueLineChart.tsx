import { memo, useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { useTimeSeries, useIsLoading } from "../hooks/useFilteredData";
import { useDashboardStore } from "../store/dashboardStore";
import type { TimeSeriesPoint } from "../types";

// ── uPlot Options Builder ─────────────────────────────────────────────────────
function buildOptions(width: number, isDark: boolean): uPlot.Options {
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "#94a3b8" : "#64748b";

  return {
    width,
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
        stroke: "#818cf8",
        fill: "rgba(99,102,241,0.08)",
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

  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef      = useRef<uPlot | null>(null);
  const isDark       = theme === "dark";

  // ── Create/destroy uPlot on mount ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const opts  = buildOptions(width, isDark);
    const [ts, rev] = toUPlotData(timeSeries);

    plotRef.current = new uPlot(opts, [ts, rev], containerRef.current);

    return () => {
      plotRef.current?.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]); // Recreate when theme changes

  // ── Update data imperatively (NO React re-render needed) ─────────────────
  useEffect(() => {
    if (!plotRef.current) return;
    const [ts, rev] = toUPlotData(timeSeries);
    plotRef.current.setData([ts, rev]);
  }, [timeSeries]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (plotRef.current && width > 0) {
        plotRef.current.setSize({ width, height: 260 });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">
            Revenue Over Time
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly buckets · Canvas-rendered · Zoom with scroll
          </p>
        </div>
        {isLoading && (
          <span className="text-xs text-amber-400 animate-pulse">
            Updating…
          </span>
        )}
      </div>

      {timeSeries.length === 0 && !isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No data matches the current filters
        </div>
      ) : (
        <div
          ref={containerRef}
          className="uplot-wrap w-full"
          style={{ minHeight: 260 }}
        />
      )}
    </div>
  );
});
