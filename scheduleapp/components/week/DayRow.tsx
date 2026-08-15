import { dayType } from "@/lib/schedule/blocks";
import type { DayKey, ScheduleBlock, ScheduleMode } from "@/lib/schedule/types";
import { formatHM } from "@/lib/time";

const DAY_LABEL: Record<DayKey, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

// Rest days (Wed/Sun) show what actually replaces MA in prep mode.
function typeBadge(type: ReturnType<typeof dayType>, mode: ScheduleMode): string {
  if (type === "upper") return "UPPER 💪";
  if (type === "lower") return "LOWER 💪";
  return mode === "prep" ? "REST · POSING + CARDIO" : "MARTIAL ARTS 🥋 REST";
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function DayRow({
  dayKey,
  date,
  mode,
  blocks,
  disabledIds,
  statusByBlock,
  isToday,
  isPast,
  expanded,
  onToggleExpand,
  onToggleBlock,
}: {
  dayKey: DayKey;
  date: string;
  mode: ScheduleMode;
  blocks: ScheduleBlock[];
  disabledIds: Set<string>;
  statusByBlock: Record<string, string | null | undefined>;
  isToday: boolean;
  isPast: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBlock: (blockId: string, nextDisabled: boolean) => void;
}) {
  const type = dayType(dayKey);
  const isRest = type === "rest";

  const active = blocks.filter((b) => !disabledIds.has(b.id));
  const done = active.filter((b) => statusByBlock[b.id] === "done").length;
  const total = active.length;
  const offCount = blocks.length - active.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: "#1A1A1A",
        borderLeftWidth: isToday ? 3 : 1,
        borderLeftColor: isToday ? "#C8F060" : "#1A1A1A",
        opacity: isPast && !isToday ? 0.55 : 1,
      }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        style={{ backgroundColor: isRest ? "#1A0A08" : "#0E0E0E" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{DAY_LABEL[dayKey]}</span>
            <span className="text-xs text-foreground/40">
              {formatDateLabel(date)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground/50">
            <span>{typeBadge(type, mode)}</span>
            {offCount > 0 && <span>· {offCount} off</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] tabular-nums text-foreground/50">
              {done}/{total}
            </span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-[#141414]">
              <div
                className={`h-full rounded-full ${
                  total > 0 && done === total ? "bg-accent" : "bg-foreground/40"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span
            className={`text-foreground/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            ⌄
          </span>
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 px-4 pb-3 pt-1">
          {blocks.map((block) => {
            const isDisabled = disabledIds.has(block.id);
            const isFixed = !!block.fixed;
            return (
              <button
                key={block.id}
                type="button"
                disabled={isFixed}
                onClick={() => onToggleBlock(block.id, !isDisabled)}
                className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-left disabled:cursor-default"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: isDisabled ? "#3A3A3A" : "#C8F060",
                  }}
                />
                <span className="w-12 shrink-0 text-xs text-foreground/50">
                  {formatHM(block.start)}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isDisabled ? "text-foreground/40 line-through" : ""
                  }`}
                >
                  {block.label}
                </span>
                {isFixed && (
                  <span className="shrink-0 rounded-md border border-card-border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-foreground/40">
                    FIXED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
