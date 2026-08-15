import type { BlockKind, ScheduleBlock } from "./schedule/types";
import { formatHM } from "./time";

// Lead time before a block starts, per CLAUDE.md's notification spec.
export const NOTIFY_LEAD_MINUTES: Partial<Record<BlockKind, number>> = {
  gym: 10,
  ma: 10,
  cardio: 10,
  meal: 5,
  read: 15,
  sleep: 15,
};

/**
 * True when `nowMinutes` falls inside this block's notification window.
 * The window is a few minutes wide (cron may not tick on the exact
 * minute) -- exactly-once delivery is enforced separately, via the
 * NotifiedBlock table's unique constraint, not by this window alone.
 */
export function isInNotifyWindow(
  block: Pick<ScheduleBlock, "kind" | "start">,
  nowMinutes: number,
  windowMinutes = 2
): boolean {
  const lead = NOTIFY_LEAD_MINUTES[block.kind];
  if (lead == null) return false;
  const target = block.start * 60 - lead;
  return nowMinutes >= target && nowMinutes < target + windowMinutes;
}

export function notificationBody(
  block: Pick<ScheduleBlock, "kind" | "start" | "dur">
): string {
  const lead = NOTIFY_LEAD_MINUTES[block.kind] ?? 0;
  const start = formatHM(block.start);
  const end = formatHM(block.start + block.dur / 60);
  return `Starts in ${lead} minutes · ${start}–${end}`;
}
