import { memo, useMemo, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFilteredRows, useFilteredCount, useIsLoading } from "../hooks/useFilteredData";
import type { SaleRow } from "../types";
import type { ReactNode } from "react";

// ── Column helper types ────────────────────────────────────────────────────────
type ColDef = {
  accessorKey: keyof SaleRow;
  header: string;
  size?: number;
  cell?: (info: { getValue: () => unknown }) => ReactNode;
  enableSorting?: boolean;
};

// ── Column definitions (memoized — never recreated) ───────────────────────────
const COLUMN_DEFS: ColDef[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 70,
    cell: (info) => (
      <span className="text-stone-500 font-mono text-xs">
        #{info.getValue() as number}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    size: 110,
    cell: (info) => (
      <span className="text-stone-300 font-mono text-xs">
        {info.getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "region",
    header: "Region",
    size: 160,
    cell: (info) => (
      <span className="text-stone-200 text-xs">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    size: 130,
    cell: (info) => (
      <span className="chip text-xs py-0.5">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "product_name",
    header: "Product",
    size: 200,
    cell: (info) => (
      <span className="text-stone-200 text-xs font-medium">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "revenue",
    header: "Revenue ($)",
    size: 120,
    cell: (info) => {
      const val = info.getValue() as number;
      return (
        <span className="text-emerald-400 font-medium font-mono text-xs">
          $
          {val.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "units_sold",
    header: "Units",
    size: 80,
    cell: (info) => (
      <span className="text-stone-300 font-mono text-xs">
        {info.getValue() as number}
      </span>
    ),
  },
  {
    accessorKey: "customer_segment",
    header: "Segment",
    size: 130,
    cell: (info) => {
      const val = info.getValue() as string;
      const colors: Record<string, string> = {
        Consumer: "text-accent-400",
        Corporate: "text-stone-300",
        "Home Office": "text-secondary-400",
        "Small Business": "text-emerald-400",
      };
      return (
        <span className={`text-xs font-medium ${colors[val] ?? "text-stone-400"}`}>
          {val}
        </span>
      );
    },
  },
];

// ── Row height constant ───────────────────────────────────────────────────────
const ROW_HEIGHT = 40;

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ sorted }: { sorted: "asc" | "desc" | false }) {
  if (!sorted) return <span className="text-slate-600 ml-1 text-xs">⇅</span>;
  return (
    <span className="text-accent-400 ml-1 text-xs">
      {sorted === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ── Main DataTable ─────────────────────────────────────────────────────────────
export const DataTable = memo(function DataTable() {
  const data = useFilteredRows();
  const filteredCount = useFilteredCount();
  const isLoading = useIsLoading();

  const [sortKey, setSortKey] = useState<keyof SaleRow | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Client-side sort ──────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = useCallback((key: keyof SaleRow) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  // ── TanStack Virtual ──────────────────────────────────────────────────────
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ROW_HEIGHT, []),
    overscan: 10,
  });

  const totalHeight = virtualizer.getTotalSize();
  const virtualRows = virtualizer.getVirtualItems();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-surface-700/80 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-stone-900 dark:text-stone-200 text-sm">
            Transaction Ledger
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            <span className="text-accent-600 dark:text-accent-400 font-medium">
              {filteredCount.toLocaleString()}
            </span>{" "}
            rows · Virtualized (TanStack Virtual) · Click headers to sort
          </p>
        </div>
        {isLoading && (
          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium animate-pulse">Loading…</span>
        )}
      </div>

      <div className="overflow-x-auto">
        {/* Sticky column headers */}
        <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 990 }}>
          <colgroup>
            {COLUMN_DEFS.map((col) => (
              <col key={col.accessorKey} style={{ width: col.size ?? 120 }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-stone-100 dark:bg-surface-800 border-b border-stone-200 dark:border-surface-700">
              {COLUMN_DEFS.map((col) => (
                <th
                  key={col.accessorKey}
                  className="px-3 py-2 text-left"
                  onClick={() => handleSort(col.accessorKey)}
                >
                  <div className="flex items-center text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer select-none whitespace-nowrap">
                    {col.header}
                    <SortIcon
                      sorted={
                        sortKey === col.accessorKey ? sortDir : false
                      }
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Virtualized body */}
        <div ref={parentRef} className="overflow-auto" style={{ height: 400 }}>
          {sortedData.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center h-full text-stone-400 text-sm py-16">
              No data matches the current filters
            </div>
          ) : (
            <div style={{ height: totalHeight, position: "relative" }}>
              {paddingTop > 0 && <div style={{ height: paddingTop }} />}

              <table
                className="w-full border-collapse"
                style={{ tableLayout: "fixed", minWidth: 990 }}
              >
                <colgroup>
                  {COLUMN_DEFS.map((col) => (
                    <col key={col.accessorKey} style={{ width: col.size ?? 120 }} />
                  ))}
                </colgroup>
                <tbody>
                  {virtualRows.map((vRow) => {
                    const row = sortedData[vRow.index];
                    return (
                      <tr
                        key={row.id}
                        className="table-row-hover border-b border-stone-100 dark:border-surface-800/60"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {COLUMN_DEFS.map((col) => (
                          <td
                            key={col.accessorKey}
                            className="px-3 overflow-hidden"
                            style={{ maxWidth: 0 }}
                          >
                            {col.cell
                              ? col.cell({ getValue: () => row[col.accessorKey] })
                              : String(row[col.accessorKey])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-stone-200 dark:border-surface-700/80 text-xs text-stone-500 flex items-center justify-between">
        <span>
          Showing ~{Math.min(virtualRows.length, sortedData.length)} DOM rows · Total {filteredCount.toLocaleString()} matches
        </span>
        <span className="text-stone-400 font-mono text-[11px]">
          Virtual Window
        </span>
      </div>
    </div>
  );
});
