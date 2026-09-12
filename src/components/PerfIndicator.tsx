import { memo, useEffect, useRef, useState } from "react";
import { useLastProcessingMs, useFilteredCount, useIsLoading, useTotalRows } from "../hooks/useFilteredData";

/**
 * PerfIndicator — HUD displaying real-time FPS, worker compute latency,
 * and active dataset row counts.
 */
export const PerfIndicator = memo(function PerfIndicator() {
  const [fps, setFps] = useState(60);
  const [fpsColor, setFpsColor] = useState<"good" | "warn" | "bad">("good");
  const frameTimesRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const processingMs = useLastProcessingMs();
  const filteredCount = useFilteredCount();
  const isLoading = useIsLoading();
  const totalRows = useTotalRows();

  // ── FPS counter via rAF ────────────────────────────────────────────────────
  useEffect(() => {
    const measure = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      const avgDelta =
        frameTimesRef.current.reduce((a, b) => a + b, 0) /
        frameTimesRef.current.length;
      const currentFps = Math.round(1000 / avgDelta);

      setFps(Math.min(currentFps, 120));
      setFpsColor(
        currentFps >= 55 ? "good" : currentFps >= 30 ? "warn" : "bad"
      );

      rafRef.current = requestAnimationFrame(measure);
    };

    rafRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const fpsColorClass = {
    good: "text-emerald-400",
    warn: "text-accent-400",
    bad: "text-rose-400",
  }[fpsColor];

  const msColorClass =
    processingMs < 100
      ? "text-emerald-400"
      : processingMs < 500
      ? "text-accent-400"
      : "text-rose-400";

  return (
    <div className="perf-hud animate-fade-in">
      {/* FPS */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: fpsColorClass.includes("emerald") ? "#10b981" : fpsColorClass.includes("accent") ? "#f59e0b" : "#f43f5e" }} />
        <span className="text-stone-400 text-[11px]">FPS</span>
        <span className={`font-semibold font-mono ${fpsColorClass}`}>{fps}</span>
      </div>

      <span className="text-stone-700">·</span>

      {/* Filter processing time */}
      <div className="flex items-center gap-1.5">
        <span className="text-stone-400 text-[11px]">Worker</span>
        {isLoading ? (
          <span className="text-accent-400 animate-pulse font-mono font-medium">…</span>
        ) : (
          <span className={`font-semibold font-mono ${msColorClass}`}>{processingMs}ms</span>
        )}
      </div>

      <span className="text-stone-700">·</span>

      {/* Row count */}
      <div className="flex items-center gap-1.5">
        <span className="text-stone-400 text-[11px]">Dataset</span>
        <span className="text-stone-200 font-medium font-mono">
          {filteredCount.toLocaleString()}
          {totalRows > 0 && (
            <span className="text-stone-500">/{totalRows.toLocaleString()}</span>
          )}
        </span>
      </div>
    </div>
  );
});
