"use client";

import { useMemo, useState } from "react";
import type { DayEntryData } from "@/lib/log";
import { DayEntry } from "./DayEntry";

type FilterKey = "all" | "gym" | "rest" | "missed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "gym", label: "Gym days" },
  { key: "rest", label: "Rest days" },
  { key: "missed", label: "Missed blocks" },
];

export function LogFeed({ entries }: { entries: DayEntryData[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    switch (filter) {
      case "gym":
        return entries.filter((e) => !e.isRest);
      case "rest":
        return entries.filter((e) => e.isRest);
      case "missed":
        return entries.filter((e) => e.skippedCount > 0 || e.unmarkedCount > 0);
      default:
        return entries;
    }
  }, [entries, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-card-border text-foreground/50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {entries.length < 3 && (
        <p className="text-xs text-foreground/40">
          Start marking blocks complete in Today view.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/40">
          No days match this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <DayEntry key={entry.date} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
