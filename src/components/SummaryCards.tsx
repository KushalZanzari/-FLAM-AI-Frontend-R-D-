import { memo, useEffect, useRef } from "react";
import { useSummaryStats, useIsLoading } from "../hooks/useFilteredData";

// ── Individual stat card ──────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  loading,
}: StatCardProps) {
  const prevValueRef = useRef<string>("");
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value !== prevValueRef.current && valueRef.current) {
      valueRef.current.classList.remove("count-animate");
      // Force reflow
      void valueRef.current.offsetWidth;
      valueRef.current.classList.add("count-animate");
      prevValueRef.current = value;
    }
  }, [value]);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="section-title text-[11px] font-medium tracking-wider text-stone-500 dark:text-stone-400">
          {title}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-28 rounded bg-stone-200 dark:bg-surface-700/50 shimmer" />
        ) : (
          <span
            ref={valueRef}
            className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 font-mono tabular-nums count-animate"
          >
            {value}
          </span>
        )}
        {subtitle && !loading && (
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
});

// ── Formatter helpers ─────────────────────────────────────────────────────────
function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Main Summary Cards ────────────────────────────────────────────────────────
export const SummaryCards = memo(function SummaryCards() {
  const stats = useSummaryStats();
  const isLoading = useIsLoading();

  const cards = [
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "—",
      subtitle: "Across filtered range",
      icon: (
        <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      title: "Units Sold",
      value: stats ? formatNumber(stats.totalUnits) : "—",
      subtitle: "Volume in filtered range",
      icon: (
        <svg className="w-3.5 h-3.5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      iconBg: "bg-accent-500/10 border border-accent-500/20",
    },
    {
      title: "Avg Order Value",
      value: stats ? formatCurrency(stats.avgOrderValue) : "—",
      subtitle: "Revenue per transaction",
      icon: (
        <svg className="w-3.5 h-3.5 text-secondary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      iconBg: "bg-secondary-500/10 border border-secondary-500/20",
    },
    {
      title: "Transactions",
      value: stats ? formatNumber(stats.transactionCount) : "—",
      subtitle: "Matching current filters",
      icon: (
        <svg className="w-3.5 h-3.5 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      iconBg: "bg-surface-700/70 border border-surface-600/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          loading={isLoading && !stats}
          {...card}
        />
      ))}
    </div>
  );
});
