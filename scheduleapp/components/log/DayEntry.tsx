import type { DayEntryData } from "@/lib/log";
import { formatHM } from "@/lib/time";
import { DaySummaryBadge } from "./DaySummaryBadge";

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function pctColor(pct: number): string {
  if (pct >= 80) return "#4ADE80";
  if (pct >= 50) return "#FBBF24";
  return "#7A7A6A";
}

export function DayEntry({ entry }: { entry: DayEntryData }) {
  const color = pctColor(entry.pct);

  return (
    <div className="rounded-xl border border-card-border bg-[#0E0E0E] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatDayLabel(entry.date)}
          </span>
          <DaySummaryBadge badges={entry.badges} />
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {entry.pct}%
        </span>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#141414]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${entry.pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {entry.loggedBlocks.map((block) => {
          const done = block.status === "done";
          return (
            <div key={block.id} className="flex items-center gap-2.5 text-sm">
              <span style={{ color: done ? "#4ADE80" : "#F87171" }}>
                {done ? "✓" : "✕"}
              </span>
              <span
                className="w-12 shrink-0 text-xs"
                style={{ color: done ? "#C8F060" : "#7A7A7A" }}
              >
                {formatHM(block.start)}
              </span>
              <span
                className={`min-w-0 flex-1 truncate ${
                  done ? "text-foreground/80" : "text-foreground/40 line-through"
                }`}
              >
                {block.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-foreground/40">
        {entry.doneCount} done · {entry.skippedCount} skipped ·{" "}
        {entry.unmarkedCount} unmarked
      </p>
    </div>
  );
}
