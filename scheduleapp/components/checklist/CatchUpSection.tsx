"use client";

import type { ChecklistItem } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { CheckButton } from "./ChecklistRow";

export interface CatchUpItem {
  date: string;
  item: ChecklistItem;
}

/**
 * Things skipped earlier this week that are still owed -- see the "owed"
 * cell state in lib/checklist/logic.ts. Finishing one here marks it done
 * on the day it was originally scheduled, not today, so the week's own
 * target isn't lowered by having skipped it on the day.
 */
export function CatchUpSection({
  items,
  dayLabel,
  onComplete,
}: {
  items: CatchUpItem[];
  dayLabel: (date: string) => string;
  onComplete: (date: string, item: ChecklistItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
        <span className="h-[7px] w-[7px] rounded-full" style={{ border: "1.5px dashed #FB923C" }} />
        Catch up
      </h3>
      {items.map(({ date, item }) => {
        const colors = BLOCK_COLORS[item.kind] ?? BLOCK_COLORS.free;
        return (
          <div
            key={`${date}:${item.key}`}
            className="flex min-h-[60px] items-center gap-3 rounded-xl border py-2.5 pl-2.5 pr-3"
            style={{ background: colors.bg, borderColor: "#2A2A2A" }}
          >
            <CheckButton
              state="open"
              accent={colors.accent}
              label={`Mark done: ${item.label}`}
              onClick={() => onComplete(date, item)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{item.label}</span>
              <span className="text-xs font-semibold" style={{ color: "#FB923C" }}>
                Skipped {dayLabel(date)} &middot; still owed this week
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
