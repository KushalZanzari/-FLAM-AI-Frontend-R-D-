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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-950/95 backdrop-blur-sm">
      <div className="text-center space-y-4 max-w-sm px-6">
        {/* Crisp logo */}
        <div className="w-12 h-12 mx-auto rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center shadow-subtle">
          <svg className="w-6 h-6 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>

        <div>
          <h1 className="text-base font-semibold text-stone-100 tracking-tight">
            RetailScope
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Loading dataset into Web Worker…
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 mx-auto h-1 bg-surface-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full animate-pulse w-2/3" />
        </div>

        <p className="text-xs text-stone-500">
          Data engine initialized
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
    <header className="border-b border-stone-200 dark:border-surface-700/80 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-surface-800 border border-stone-300 dark:border-surface-700 flex items-center justify-center shadow-subtle">
            <svg className="w-4 h-4 text-accent-600 dark:text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                RetailScope
              </h1>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-surface-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-surface-700">
                Analytics
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">
              {totalRows > 0 ? (
                <>
                  <span className="text-accent-600 dark:text-accent-400 font-medium">
                    {totalRows.toLocaleString()}
                  </span>{" "}
                  transactions · Web Worker + Canvas Engine
                </>
              ) : (
                "Loading dataset…"
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>

          <button
            onClick={toggleTheme}
            className="btn-ghost w-8 h-8 p-0 flex items-center justify-center text-stone-600 dark:text-stone-300"
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
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [theme]);

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueLineChart />
              <CategoryBarChart />
            </div>

            {/* Scatter chart */}
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
