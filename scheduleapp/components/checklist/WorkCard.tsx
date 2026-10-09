"use client";

import { BLOCK_COLORS } from "@/lib/schedule/colors";

const TARGET_LOW = 12;
const TARGET_HIGH = 16;
const SCALE_MAX = 20;

export function WorkCard({
  hoursToday,
  hoursWeek,
  onChange,
}: {
  hoursToday: number;
  hoursWeek: number;
  onChange: (hours: number) => void;
}) {
  const { bg, accent } = BLOCK_COLORS.work;
  const step = (delta: number) => onChange(Math.max(0, Math.min(12, hoursToday + delta)));

  return (
    <section
      aria-label="Side job"
      className="flex flex-col gap-2.5 rounded-xl border border-card-border p-3.5"
      style={{ background: bg }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold">Side job</h3>
          <span className="max-w-[32ch] text-xs text-foreground/50">
            Log your hours here. They don&apos;t count toward the checklist.
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-black/40 p-1">
          <button type="button" onClick={() => step(-0.5)} aria-label="Half an hour less" className="h-9 w-9 rounded-full text-lg" style={{ color: accent }}>
            −
          </button>
          <output aria-live="polite" className="min-w-[52px] text-center font-bold tabular-nums">
            {hoursToday}h
          </output>
          <button type="button" onClick={() => step(0.5)} aria-label="Half an hour more" className="h-9 w-9 rounded-full text-lg" style={{ color: accent }}>
            +
          </button>
        </div>
      </div>
      <div
        className="relative h-2.5 rounded-full bg-white/5"
        role="img"
        aria-label={`${hoursWeek} of ${TARGET_LOW} to ${TARGET_HIGH} hours this week`}
      >
        <div
          className="absolute -inset-y-1 border-x"
          style={{
            left: `${(TARGET_LOW / SCALE_MAX) * 100}%`,
            width: `${((TARGET_HIGH - TARGET_LOW) / SCALE_MAX) * 100}%`,
            borderColor: `${accent}88`,
            background: `${accent}14`,
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(100, (hoursWeek / SCALE_MAX) * 100)}%`, background: accent }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-foreground/50 tabular-nums">
        <span>
          <strong className="text-foreground">{hoursWeek}h</strong> this week
        </span>
        <span>
          target {TARGET_LOW}–{TARGET_HIGH}h
        </span>
      </div>
    </section>
  );
}
