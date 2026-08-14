import { dayKeyForDate } from "@/lib/schedule/blocks";
import {
  HABIT_CATEGORIES,
  heatmapForCategory,
  type LogsByDate,
} from "@/lib/habits";
import type { SemesterKey, DayKey } from "@/lib/schedule/types";

const DAY_LETTER: Record<DayKey, string> = {
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
  Sun: "S",
};

const CELL_COLOR: Record<string, string> = {
  none: "#141414",
  missed: "#1A1A1A",
  partial: "#4ADE8044",
  full: "#C8F060",
};

export function HeatmapSection({
  logsByDate,
  semester,
  today,
}: {
  logsByDate: LogsByDate;
  semester: SemesterKey;
  today: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground/70">Last 7 days</h2>
      <div className="flex flex-col gap-2.5">
        {HABIT_CATEGORIES.map((cat) => {
          const cells = heatmapForCategory(logsByDate, semester, cat, today);
          return (
            <div key={cat.key} className="flex items-center gap-3">
              <div className="flex w-24 shrink-0 items-center gap-1.5">
                <span className="text-sm">{cat.icon}</span>
                <span className="truncate text-xs text-foreground/60">
                  {cat.label}
                </span>
              </div>
              <div className="flex flex-1 justify-between gap-1">
                {cells.map((cell) => (
                  <div key={cell.date} className="flex flex-col items-center gap-1">
                    <div
                      className="h-4 w-4 rounded-[4px]"
                      style={{
                        backgroundColor: CELL_COLOR[cell.state],
                        outline: cell.isToday ? "1.5px solid #333" : undefined,
                        outlineOffset: cell.isToday ? "1px" : undefined,
                      }}
                    />
                    <span className="text-[9px] text-foreground/30">
                      {DAY_LETTER[dayKeyForDate(cell.date)]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
