import { memo, useEffect, useRef } from "react";
import { useSummaryStats, useIsLoading } from "../hooks/useFilteredData";

// ── Individual stat card ──────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  gradient: string;
  loading?: boolean;
}

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  gradient,
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
    <div className="stat-card relative overflow-hidden group">
      {/* Gradient glow background */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
        style={{ filter: "blur(40px)", zIndex: 0 }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="section-title">{title}</span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}
          >
            {icon}
          </div>
        </div>
        {loading ? (
          <div className="h-9 w-32 rounded-lg bg-white/5 shimmer" />
        ) : (
          <span
            ref={valueRef}
            className="text-3xl font-bold tracking-tight text-slate-100 dark:text-slate-100 count-animate"
          >
            {value}
          </span>
        )}
        {subtitle && !loading && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
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
      subtitle: "Across filtered transactions",
      icon: "💰",
      color: "bg-emerald-500/20 text-emerald-400",
      gradient: "bg-gradient-to-br from-emerald-600/10 to-transparent",
    },
    {
      title: "Units Sold",
      value: stats ? formatNumber(stats.totalUnits) : "—",
      subtitle: "Total items in filtered range",
      icon: "📦",
      color: "bg-accent-500/20 text-accent-400",
      gradient: "bg-gradient-to-br from-accent-600/10 to-transparent",
    },
    {
      title: "Avg Order Value",
      value: stats ? formatCurrency(stats.avgOrderValue) : "—",
      subtitle: "Revenue per transaction",
      icon: "📈",
      color: "bg-amber-500/20 text-amber-400",
      gradient: "bg-gradient-to-br from-amber-600/10 to-transparent",
    },
    {
      title: "Transactions",
      value: stats ? formatNumber(stats.transactionCount) : "—",
      subtitle: "Matching current filters",
      icon: "🔢",
      color: "bg-secondary-500/20 text-secondary-400",
      gradient: "bg-gradient-to-br from-secondary-400/10 to-transparent",
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
