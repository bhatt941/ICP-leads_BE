import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";

export function AutocompleteInput({ label, value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value === "All" ? "" : value);

  useEffect(() => {
    setDraft(value === "All" ? "" : value);
  }, [value]);

  const predictions = useMemo(() => {
    const term = draft.trim().toLowerCase();
    const filtered = options.filter((option) => option !== "All");
    if (!term) return filtered.slice(0, 8);
    return filtered
      .filter((option) => option.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(term) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 8);
  }, [draft, options]);

  function selectOption(option) {
    setDraft(option === "All" ? "" : option);
    onChange(option);
    setOpen(false);
  }

  function applyTypedValue(nextValue) {
    setDraft(nextValue);
    const exact = options.find((option) => option.toLowerCase() === nextValue.trim().toLowerCase());
    if (exact) onChange(exact);
    else if (!nextValue.trim()) onChange("All");
    else onChange(nextValue);
  }

  return (
    <label className="relative block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
        <input
          value={draft}
          onChange={(event) => applyTypedValue(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder || `Search ${label.toLowerCase()}`}
          className="h-10 w-full rounded-md border border-border bg-card px-9 pr-16 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {draft && (
          <button
            type="button"
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
            onClick={() => selectOption("All")}
            aria-label={`Clear ${label}`}
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((current) => !current)}
          aria-label={`Open ${label} predictions`}
        >
          <ChevronDown size={15} />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-border bg-card shadow-soft">
          <button
            type="button"
            className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-muted", value === "All" && "text-primary")}
            onMouseDown={() => selectOption("All")}
          >
            All {label}
          </button>
          {predictions.length ? (
            predictions.map((option) => (
              <button
                type="button"
                key={option}
                className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-muted", option === value && "bg-primary/10 text-primary")}
                onMouseDown={() => selectOption(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No prediction found</div>
          )}
        </div>
      )}
    </label>
  );
}
