import { memo, useEffect, useRef } from "react";
import { useScatterData, useIsLoading } from "../hooks/useFilteredData";
import { useDashboardStore } from "../store/dashboardStore";
import type { ScatterPoint } from "../types";

/**
 * ScatterChart — Canvas 2D visualization of Revenue vs Units Sold
 * with LTTB-downsampled points and device-pixel-ratio scaling.
 */

function drawScatter(
  canvas: HTMLCanvasElement,
  data: ScatterPoint[],
  isDark: boolean
) {
  if (!data.length) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const maxX = Math.max(...data.map((p) => p.x));
  const maxY = Math.max(...data.map((p) => p.y));
  const minX = Math.min(...data.map((p) => p.x));
  const minY = Math.min(...data.map((p) => p.y));

  const xScale = (v: number) => pad.left + ((v - minX) / (maxX - minX || 1)) * plotW;
  const yScale = (v: number) => pad.top  + plotH - ((v - minY) / (maxY - minY || 1)) * plotH;

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const labelColor = isDark ? "#71717a" : "#78716c";
  const dotColor   = isDark ? "rgba(245, 158, 11, 0.45)" : "rgba(217, 119, 6, 0.45)";

  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.fillStyle = labelColor;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // Grid lines
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const v = minY + ((maxY - minY) * i) / yTicks;
    const y = yScale(v);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    const label = v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`;
    ctx.textAlign = "right";
    ctx.fillText(label, pad.left - 6, y + 3);
  }

  // X axis ticks
  const xTicks = 6;
  for (let i = 0; i <= xTicks; i++) {
    const v = Math.round(minX + ((maxX - minX) * i) / xTicks);
    const x = xScale(v);
    ctx.textAlign = "center";
    ctx.fillText(String(v), x, pad.top + plotH + 16);
  }

  // Axis labels
  ctx.fillStyle = isDark ? "#a1a1aa" : "#57534e";
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Units Sold", pad.left + plotW / 2, h - 4);

  ctx.save();
  ctx.translate(14, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Revenue ($)", 0, 0);
  ctx.restore();

  // Draw points — single batched fill call per "color bucket" for performance
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  for (const p of data) {
    const px = xScale(p.x);
    const py = yScale(p.y);
    ctx.moveTo(px + 2.5, py);
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
  }
  ctx.fill();
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ScatterChart = memo(function ScatterChart() {
  const scatterData = useScatterData();
  const isLoading   = useIsLoading();
  const theme       = useDashboardStore((s) => s.theme);
  const isDark      = theme === "dark";

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Draw on data change ───────────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current && scatterData.length > 0) {
      drawScatter(canvasRef.current, scatterData, isDark);
    }
  }, [scatterData, isDark]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (canvasRef.current && scatterData.length > 0) {
        drawScatter(canvasRef.current, scatterData, isDark);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scatterData, isDark]);

  return (
    <div className="chart-container min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-stone-900 dark:text-stone-200 text-sm">
            Revenue vs Units Sold
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            LTTB-downsampled to{" "}
            <span className="text-accent-600 dark:text-accent-400 font-medium">
              {scatterData.length.toLocaleString()}
            </span>{" "}
            pts · Canvas 2D render · Zero DOM overhead
          </p>
        </div>
        {isLoading && (
          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium animate-pulse">Updating…</span>
        )}
      </div>

      <div ref={containerRef} className="w-full" style={{ height: 280 }}>
        {scatterData.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center text-stone-500 text-sm">
            No data matches the current filters
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        )}
      </div>
    </div>
  );
});
