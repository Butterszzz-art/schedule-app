import { dayIndexForDate } from "@/lib/schedule/days";
import { fraction, isSkipped } from "./progress";
import type { ChecklistItem, DayValues, RoutineItemDTO } from "./types";

// Pure checklist logic -- no DB, no React -- so it's easy to unit test.
// The per-item progress maths lives in ./progress so client components can
// use it without bundling this file.

/**
 * Everything on the list for `date`: the routine items scheduled for that
 * weekday, sorted by area (in `areaOrder`, as returned by getAreas), then
 * routine order within each area.
 */
export function itemsForDate(
  routine: RoutineItemDTO[],
  date: string,
  areaOrder: string[]
): ChecklistItem[] {
  const day = dayIndexForDate(date);
  return routine
    .filter((r) => r.days.includes(day))
    .sort(
      (a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area) || a.order - b.order
    )
    .map((r) => ({
      key: r.key,
      area: r.area,
      kind: r.kind,
      label: r.label,
      hint: r.hint,
      type: r.type,
      target: r.target,
      chunks: r.chunks,
    }));
}

// ── Week grid ──
// "owed": skipped earlier in the current week, still catchable -- doesn't
// count against you yet, but doesn't drop the week's target either. Once
// the week it belongs to has fully elapsed, an unresolved "owed" becomes a
// real "miss" (see buildWeekRows) so total weekly productivity can't be
// quietly lowered by skipping -- only actually finishing something keeps
// the target, just not necessarily on the day it was scheduled.
export type CellState = "none" | "full" | "half" | "miss" | "due" | "owed";

export interface WeekRow {
  key: string;
  label: string;
  kind: ChecklistItem["kind"];
  cells: CellState[];
}

interface Entry {
  f: number;
  skipped: boolean;
}

export function buildWeekRows(
  dates: string[],
  itemsByDate: Record<string, ChecklistItem[]>,
  valuesByDate: Record<string, DayValues>,
  today: string
): WeekRow[] {
  // Once the week's last day has passed, there's no day left to catch up
  // on, so any still-skipped entry resolves to a real miss.
  const weekOver = dates[dates.length - 1] < today;
  const rows = new Map<string, WeekRow & { entries: Entry[][] }>();
  dates.forEach((date, d) => {
    for (const item of itemsByDate[date] ?? []) {
      let row = rows.get(item.key);
      if (!row) {
        row = { key: item.key, label: item.label, kind: item.kind, cells: [], entries: dates.map(() => []) };
        rows.set(item.key, row);
      }
      const value = valuesByDate[date]?.[item.key];
      row.entries[d].push({ f: fraction(item, value), skipped: isSkipped(value) });
    }
  });
  return [...rows.values()].map(({ entries, ...row }) => ({
    ...row,
    cells: entries.map((list, d): CellState => {
      const active = list.filter((e) => !e.skipped);
      if (list.length > 0 && active.length === 0) return weekOver ? "miss" : "owed";
      if (active.length === 0) return "none";
      const f = active.reduce((s, e) => s + e.f, 0) / active.length;
      if (f === 1) return "full";
      if (f > 0) return "half";
      return dates[d] < today ? "miss" : "due";
    }),
  }));
}

// ── Weekly targets ──
// The routine's own days-per-week count already IS a weekly target (e.g.
// an item scheduled 5 days = target 5/week). Derived straight from the week
// grid's rows so "owed" (still catchable) and "miss" (the week ran out)
// stay consistent between the grid and the targets list.
export interface WeeklyTarget {
  key: string;
  label: string;
  kind: ChecklistItem["kind"];
  target: number;
  done: number;
  owed: number;
}

export function weeklyTargets(rows: WeekRow[]): WeeklyTarget[] {
  return rows
    .map((row) => ({
      key: row.key,
      label: row.label,
      kind: row.kind,
      target: row.cells.filter((c) => c !== "none").length,
      done: row.cells.filter((c) => c === "full").length,
      owed: row.cells.filter((c) => c === "owed").length,
    }))
    .filter((t) => t.target > 0);
}
