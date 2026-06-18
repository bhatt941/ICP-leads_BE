import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function FilterConsole({ title = "Filters", search, onSearch, filters, resultCount, totalCount, onReset }) {
  const activeFilters = filters.filter((filter) => filter.value !== "All" && filter.value !== "");

  return (
    <Card className="mb-4 p-0">
      <div className="border-b border-border p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal size={16} className="text-primary" />
              {title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resultCount.toLocaleString()} of {totalCount.toLocaleString()} records match
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw size={15} /> Reset
          </Button>
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[1.25fr_repeat(6,minmax(0,1fr))]">
        <Input placeholder="Search by name, company, location, email..." value={search} onChange={(event) => onSearch(event.target.value)} />
        {filters.map((filter) => (
          <AutocompleteInput
            key={filter.key}
            label={filter.label}
            value={filter.value}
            options={filter.options}
            onChange={filter.onChange}
            placeholder={filter.placeholder}
          />
        ))}
      </div>
      <div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        {activeFilters.length ? (
          activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => filter.onChange("All")}
              className="inline-flex items-center gap-2 rounded-md bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/18"
            >
              {filter.label}: {filter.value}
              <X size={13} />
            </button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No active filters. Explore the full market view.</span>
        )}
        {search && <Badge tone="orange">Search: {search}</Badge>}
      </div>
    </Card>
  );
}
