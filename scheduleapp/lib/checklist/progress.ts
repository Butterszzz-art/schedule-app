import { addDays } from "@/lib/time";
import type { ChecklistItem, DayValues, ExtraDTO } from "./types";

// Progress maths for checklist items. Kept free of the uni timetable import
// so client components can use it cheaply.

/** The value that means "fully done" for an item. */
export function fullValue(item: Pick<ChecklistItem, "type" | "target" | "chunks">): number {
  if (item.type === "count") return item.target;
  if (item.type === "chunks") return (1 << item.chunks.length) - 1;
  return 1;
}

function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
}

/** 0..1 progress for an item given its stored value (undefined = nothing yet). */
export function fraction(
  item: Pick<ChecklistItem, "type" | "target" | "chunks">,
  value: number | undefined
): number {
  const v = value ?? 0;
  if (v <= 0) return 0;
  if (item.type === "count") return Math.min(1, v / Math.max(1, item.target));
  if (item.type === "chunks") {
    const n = item.chunks.length;
    return n === 0 ? 0 : popcount(v & fullValue(item)) / n;
  }
  return 1;
}

export interface ExtraView extends ExtraDTO {
  /** Set when this item was added on an earlier day and rolled over. */
  carriedFrom: string | null;
}

/**
 * One-off items to show on `date`. A finished item shows on the day it was
 * ticked off. An unfinished one shows on the day it was added, and also
 * rolls over onto today (never onto other days) until it's done.
 */
export function extrasForDate(
  extras: ExtraDTO[],
  date: string,
  today: string
): ExtraView[] {
  const out: ExtraView[] = [];
  for (const x of extras) {
    if (x.scope === "week") continue;
    if (x.doneOn) {
      if (x.doneOn === date) out.push({ ...x, carriedFrom: x.date !== date ? x.date : null });
    } else if (x.date === date) {
      out.push({ ...x, carriedFrom: null });
    } else if (date === today && x.date < today) {
      out.push({ ...x, carriedFrom: x.date });
    }
  }
  // Carried-over items first (oldest first), then the day's own.
  // "~" sorts after any ISO date in a plain string comparison.
  const sortKey = (x: ExtraView) => x.carriedFrom ?? "~";
  return out.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));
}

/**
 * "This week" tasks for the ISO week starting `monday`. Same rules as
 * extrasForDate, a week at a time: a finished task shows in the week it was
 * ticked off; an unfinished one shows in its own week and rolls over into
 * the current week (never into other weeks) until it's done.
 */
export function weekTasksFor(
  extras: ExtraDTO[],
  monday: string,
  thisMonday: string
): ExtraView[] {
  const sunday = addDays(monday, 6);
  const out: ExtraView[] = [];
  for (const x of extras) {
    if (x.scope !== "week") continue;
    if (x.doneOn) {
      if (x.doneOn >= monday && x.doneOn <= sunday) {
        out.push({ ...x, carriedFrom: x.date !== monday ? x.date : null });
      }
    } else if (x.date === monday) {
      out.push({ ...x, carriedFrom: null });
    } else if (monday === thisMonday && x.date < monday) {
      out.push({ ...x, carriedFrom: x.date });
    }
  }
  const sortKey = (x: ExtraView) => x.carriedFrom ?? "~";
  return out.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));
}

export function dayScore(
  items: ChecklistItem[],
  values: DayValues,
  extras: ExtraView[]
): { done: number; total: number } {
  const doneItems = items.filter((i) => fraction(i, values[i.key]) === 1).length;
  const doneExtras = extras.filter((x) => x.doneOn).length;
  return { done: doneItems + doneExtras, total: items.length + extras.length };
}
