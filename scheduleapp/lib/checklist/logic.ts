import { UNI_SESSIONS } from "@/lib/schedule/uni";
import { dayIndexForDate } from "@/lib/schedule/days";
import type { UniSession } from "@/lib/schedule/types";
import { formatHM } from "@/lib/time";
import { AREA_KEYS } from "./areas";
import { fraction } from "./progress";
import type { ChecklistItem, DayValues, RoutineItemDTO } from "./types";

// Pure checklist logic -- no DB, no React -- so it's easy to unit test.
// The per-item progress maths lives in ./progress so client components can
// use it without bundling the whole uni timetable.

// Mandatory session types: always on the list. Plain lectures and
// question hours only show up from 13:00 on (earlier ones are skipped).
const OPTIONAL_UNI_TYPES = ["Lecture", "Question session"];

export function attendsSession(s: Pick<UniSession, "type" | "start">): boolean {
  return s.start >= 13 || !OPTIONAL_UNI_TYPES.includes(s.type);
}

export function uniItemsForDate(
  date: string,
  sessions: UniSession[] = UNI_SESSIONS
): ChecklistItem[] {
  return sessions
    .filter((s) => s.date === date && attendsSession(s))
    .sort((a, b) => a.start - b.start)
    .map((s) => ({
      key: `uni:${s.id}`,
      area: "uni",
      kind: "uni",
      label: `${s.type}: ${s.courseName}`,
      hint: [`${formatHM(s.start)}–${formatHM(s.end)}`, s.location, s.note]
        .filter(Boolean)
        .join(" · "),
      type: "check",
      target: 1,
      chunks: [],
    }));
}

/**
 * Everything on the list for `date`: the routine items scheduled for that
 * weekday (pass the routine for that date's schedule mode), plus that
 * day's uni sessions. Sorted by area, then routine order.
 */
export function itemsForDate(
  routine: RoutineItemDTO[],
  date: string,
  sessions: UniSession[] = UNI_SESSIONS
): ChecklistItem[] {
  const day = dayIndexForDate(date);
  const fromRoutine: ChecklistItem[] = routine
    .filter((r) => r.days.includes(day))
    .sort(
      (a, b) =>
        AREA_KEYS.indexOf(a.area) - AREA_KEYS.indexOf(b.area) || a.order - b.order
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
  // Array.sort is stable, so this keeps routine order within each area.
  return [...fromRoutine, ...uniItemsForDate(date, sessions)].sort(
    (a, b) => AREA_KEYS.indexOf(a.area) - AREA_KEYS.indexOf(b.area)
  );
}

// ── Week grid ──
export type CellState = "none" | "full" | "half" | "miss" | "due";

export interface WeekRow {
  key: string;
  label: string;
  kind: ChecklistItem["kind"];
  cells: CellState[];
}

/** Gym, study and uni each collapse into one row; everything else gets its own. */
function rowKey(item: ChecklistItem): { key: string; label: string } {
  if (item.kind === "gym") return { key: "gym", label: "Gym" };
  if (item.kind === "study") return { key: "study", label: "Study" };
  if (item.area === "uni") return { key: "uni", label: "Uni" };
  return { key: item.key, label: item.label };
}

export function buildWeekRows(
  dates: string[],
  itemsByDate: Record<string, ChecklistItem[]>,
  valuesByDate: Record<string, DayValues>,
  today: string
): WeekRow[] {
  const rows = new Map<string, WeekRow & { fr: number[][] }>();
  dates.forEach((date, d) => {
    for (const item of itemsByDate[date] ?? []) {
      const { key, label } = rowKey(item);
      let row = rows.get(key);
      if (!row) {
        row = { key, label, kind: item.kind, cells: [], fr: dates.map(() => []) };
        rows.set(key, row);
      }
      row.fr[d].push(fraction(item, valuesByDate[date]?.[item.key]));
    }
  });
  return [...rows.values()].map(({ fr, ...row }) => ({
    ...row,
    cells: fr.map((list, d): CellState => {
      if (list.length === 0) return "none";
      const f = list.reduce((s, x) => s + x, 0) / list.length;
      if (f === 1) return "full";
      if (f > 0) return "half";
      return dates[d] < today ? "miss" : "due";
    }),
  }));
}
