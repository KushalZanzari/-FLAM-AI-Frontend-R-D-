import { useEffect } from "react";
import { useWorker } from "./hooks/useWorker";
import { useDashboardStore } from "./store/dashboardStore";
import { SummaryCards } from "./components/SummaryCards";
import { RevenueLineChart } from "./components/RevenueLineChart";
import { CategoryBarChart } from "./components/CategoryBarChart";
import { ScatterChart } from "./components/ScatterChart";
import { DataTable } from "./components/DataTable";
import { FilterPanel } from "./components/FilterPanel";
import { PerfIndicator } from "./components/PerfIndicator";
import { LiveDataTicker } from "./components/LiveDataTicker";
import { useLoadingCsv } from "./hooks/useFilteredData";

// ── Loading Overlay ───────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-900/95 backdrop-blur">
      <div className="text-center space-y-4 max-w-sm px-6">
        {/* Animated logo */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-accent-600/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-accent-600/30 border border-accent-500/40 flex items-center justify-center text-3xl">
            📊
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-100">
            RetailScope
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Loading 300,000 rows into Web Worker…
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-600 rounded-full overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full animate-shimmer w-1/2" />
        </div>

        <p className="text-xs text-slate-600">
          CSV is parsed off-main-thread so the UI stays responsive
        </p>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
  const theme = useDashboardStore((s) => s.theme);
  const toggleTheme = useDashboardStore((s) => s.toggleTheme);
  const totalRows = useDashboardStore((s) => s.totalRows);

  return (
    <header className="border-b border-white/5 bg-surface-800/50 backdrop-blur sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-600/30 border border-accent-500/40 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight">
              RetailScope
            </h1>
            <p className="text-xs text-slate-500 leading-tight">
              {totalRows > 0 ? (
                <>
                  <span className="text-accent-400 font-medium">
                    {totalRows.toLocaleString()}
                  </span>{" "}
                  rows · 2022–2024 · Web Worker + Canvas
                </>
              ) : (
                "Loading dataset…"
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>

          <button
            onClick={toggleTheme}
            className="btn-ghost text-sm w-9 h-9 p-0 flex items-center justify-center"
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  // Initialize the web worker + CSV loading
  useWorker();

  const loadingCsv = useLoadingCsv();
  const theme = useDashboardStore((s) => s.theme);

  // Apply initial theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return (
    <div className="min-h-screen">
      {/* Loading overlay */}
      {loadingCsv && <LoadingOverlay />}

      {/* Header */}
      <Header />

      {/* Main layout */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* ── Sidebar: Filters ─────────────────────────────────────────── */}
          <div className="w-64 flex-shrink-0">
            <FilterPanel />
          </div>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Summary Cards */}
            <SummaryCards />

            {/* Charts row 1: Line + Bar */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RevenueLineChart />
              <CategoryBarChart />
            </div>

            {/* Scatter chart (full width — stress test) */}
            <ScatterChart />

            {/* Live data feed */}
            <LiveDataTicker />

            {/* Data table */}
            <DataTable />
          </div>
        </div>
      </main>

      {/* Always-visible perf HUD */}
      <PerfIndicator />
    </div>
  );
}
