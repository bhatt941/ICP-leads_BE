import { ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";

export function DataTable({ columns, rows, pageSize = 10, initialSort }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      if (typeof left === "number" && typeof right === "number") return sort.direction === "asc" ? left - right : right - left;
      return sort.direction === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  function onSort(key) {
    setPage(1);
    setSort((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  if (!rows.length) return <EmptyState />;

  return (
    <Card className="p-0">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.sortable ? (
                    <button className="inline-flex items-center gap-2" onClick={() => onSort(column.key)}>
                      {column.label}
                      <ArrowDownUp size={14} aria-hidden />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-border/70 transition hover:bg-muted/35">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
            <ChevronLeft size={16} /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
