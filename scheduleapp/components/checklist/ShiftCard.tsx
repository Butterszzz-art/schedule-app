"use client";

import { useState } from "react";
import {
  formatHours,
  shiftHours,
  SHIFT_TARGET_HIGH,
  SHIFT_TARGET_LOW,
  totalHours,
} from "@/lib/checklist/shifts";
import type { ShiftDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { dayKeyForDate } from "@/lib/schedule/days";

const SCALE_MAX = 20;

export function ShiftCard({
  date,
  dayLabel,
  shifts,
  onAdd,
  onDelete,
}: {
  date: string;
  dayLabel: string;
  shifts: ShiftDTO[]; // the whole week's shifts
  onAdd: (shift: Omit<ShiftDTO, "id">) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const { bg, accent } = BLOCK_COLORS.work;
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("21:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const week = totalHours(shifts);
  const left = Math.max(0, SHIFT_TARGET_LOW - week);

  const add = async () => {
    if (start === end) {
      setError("Start and end can't be the same time.");
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onAdd({ date, start, end, note: "" });
    setBusy(false);
    if (!ok) setError("Couldn't save that shift. Check your connection and try again.");
  };

  return (
    <section aria-label="Side job shifts" className="flex flex-col gap-3 rounded-xl border border-card-border p-3.5" style={{ background: bg }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">Side job</h3>
        <span className="text-xs text-foreground/50 tabular-nums">
          {formatHours(week)} this week
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-white/5" role="img" aria-label={`${week} of ${SHIFT_TARGET_LOW} to ${SHIFT_TARGET_HIGH} hours this week`}>
        <div
          className="absolute -inset-y-1 border-x"
          style={{
            left: `${(SHIFT_TARGET_LOW / SCALE_MAX) * 100}%`,
            width: `${((SHIFT_TARGET_HIGH - SHIFT_TARGET_LOW) / SCALE_MAX) * 100}%`,
            borderColor: `${accent}88`,
            background: `${accent}14`,
          }}
        />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (week / SCALE_MAX) * 100)}%`, background: accent }} />
      </div>
      <p className="text-[11px] text-foreground/50">
        {week > SHIFT_TARGET_HIGH
          ? `${formatHours(week - SHIFT_TARGET_HIGH)} over your ${SHIFT_TARGET_HIGH}h max`
          : left > 0
            ? `${formatHours(left)} to go to reach ${SHIFT_TARGET_LOW}h`
            : `In your ${SHIFT_TARGET_LOW}–${SHIFT_TARGET_HIGH}h range`}
      </p>

      {shifts.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {shifts.map((s) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${s.date === date ? "bg-black/40" : "bg-black/20 text-foreground/60"}`}
            >
              <span className="w-9 font-semibold">{dayKeyForDate(s.date)}</span>
              <span className="flex-1 tabular-nums">
                {s.start}–{s.end}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: accent }}>
                {formatHours(shiftHours(s.start, s.end))}
              </span>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                aria-label={`Remove ${dayKeyForDate(s.date)} shift ${s.start} to ${s.end}`}
                className="grid h-9 w-9 place-items-center rounded-full text-lg text-foreground/30"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-foreground/50">
          Start
          <input id="shift-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required className="min-h-[44px] rounded-xl border border-[#222] bg-[#141414] px-3 text-sm text-foreground outline-none focus:border-accent" />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-foreground/50">
          End
          <input id="shift-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required className="min-h-[44px] rounded-xl border border-[#222] bg-[#141414] px-3 text-sm text-foreground outline-none focus:border-accent" />
        </label>
        <button type="submit" disabled={busy} className="min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold text-[#0A0A0A] disabled:opacity-50" style={{ background: accent }}>
          Add {dayLabel}
        </button>
      </form>
      {shifts.length === 0 && (
        <p className="text-xs text-foreground/50">No shifts this week yet. Pick a day above, then add its shift.</p>
      )}
      {error && <p role="alert" className="text-xs text-[#FCA5A5]">{error}</p>}
    </section>
  );
}
