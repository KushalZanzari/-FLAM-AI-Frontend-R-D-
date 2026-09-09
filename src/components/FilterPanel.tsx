import { memo, useCallback, useRef, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import { useFilters } from "../hooks/useFilteredData";
import {
  ALL_REGIONS,
  ALL_CATEGORIES,
  ALL_SEGMENTS,
} from "../types";

const DEBOUNCE_MS = 250;

// ── Multi-select checkbox group ───────────────────────────────────────────────
interface CheckGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  colorDots?: Record<string, string>;
}

const CheckGroup = memo(function CheckGroup({
  title,
  options,
  selected,
  onChange,
  colorDots,
}: CheckGroupProps) {
  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    onChange(next);
  };

  const toggleAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="section-title text-xs">{title}</span>
        {selected.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {options.map((opt) => {
          const isChecked = selected.length === 0 ? false : selected.includes(opt);
          return (
            <label
              key={opt}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(opt)}
                className="flex-shrink-0"
              />
              {colorDots?.[opt] && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorDots[opt] }}
                />
              )}
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-tight">
                {opt}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
});

// ── Category color dots ───────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "#818cf8",
  Apparel: "#fb7185",
  "Home & Garden": "#34d399",
  Beauty: "#f472b6",
  Sports: "#fbbf24",
  "Food & Grocery": "#22d3ee",
};

// ── Main FilterPanel ──────────────────────────────────────────────────────────
export const FilterPanel = memo(function FilterPanel() {
  const filters = useFilters();
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  // Local state for search (debounced before dispatching)
  const [searchValue, setSearchValue] = useState(filters.productSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced search ────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters({ productSearch: value });
      }, DEBOUNCE_MS);
    },
    [setFilters]
  );

  // ── Immediate filter handlers ───────────────────────────────────────────────
  const handleDateFrom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFilters({ dateFrom: e.target.value }),
    [setFilters]
  );

  const handleDateTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFilters({ dateTo: e.target.value }),
    [setFilters]
  );

  const handleReset = () => {
    setSearchValue("");
    resetFilters();
  };

  const activeFilterCount =
    filters.regions.length +
    filters.categories.length +
    filters.customerSegments.length +
    (filters.productSearch ? 1 : 0);

  return (
    <aside className="card p-5 space-y-6 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-200 text-sm">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="chip">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <span className="section-title text-xs">Product Search</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="e.g. Laptop Pro 15"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-slate-600">Debounced {DEBOUNCE_MS}ms</p>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <span className="section-title text-xs">Date Range</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              min="2022-01-01"
              max="2024-12-31"
              onChange={handleDateFrom}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">To</label>
            <input
              type="date"
              value={filters.dateTo}
              min="2022-01-01"
              max="2024-12-31"
              onChange={handleDateTo}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Regions */}
      <CheckGroup
        title="Region"
        options={ALL_REGIONS}
        selected={filters.regions}
        onChange={(v) => setFilters({ regions: v })}
      />

      {/* Categories */}
      <CheckGroup
        title="Category"
        options={ALL_CATEGORIES}
        selected={filters.categories}
        onChange={(v) => setFilters({ categories: v })}
        colorDots={CATEGORY_COLORS}
      />

      {/* Customer Segments */}
      <CheckGroup
        title="Customer Segment"
        options={ALL_SEGMENTS}
        selected={filters.customerSegments}
        onChange={(v) => setFilters({ customerSegments: v })}
      />
    </aside>
  );
});
