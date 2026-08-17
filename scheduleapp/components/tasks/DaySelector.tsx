"use client";

import type { DayKey } from "@/lib/schedule/types";

const DAYS_MON_FIRST: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DaySelector({
  selectedDay,
  dayCounts,
  onSelect,
}: {
  selectedDay: DayKey;
  dayCounts: Record<string, number>;
  onSelect: (day: DayKey) => void;
}) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {DAYS_MON_FIRST.map((day) => {
        const count = dayCounts[day] ?? 0;
        const active = day === selectedDay;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            className="min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors"
            style={
              active
                ? { borderColor: "#C8F060", background: "#C8F06018", color: "#C8F060" }
                : {
                    borderColor: count > 0 ? "#2A2A2A" : "#1A1A1A",
                    color: "#888",
                  }
            }
          >
            {day}
            {count > 0 && <span className="ml-1 text-foreground/40">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
