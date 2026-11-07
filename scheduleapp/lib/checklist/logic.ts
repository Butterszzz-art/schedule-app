import { UNI_SESSIONS } from "@/lib/schedule/uni";
import { dayIndexForDate } from "@/lib/schedule/days";
import type { UniSession } from "@/lib/schedule/types";
import { addDays, formatHM } from "@/lib/time";
import { AREA_KEYS } from "./areas";
import { fraction, isSkipped } from "./progress";
import { studyPlanItemsForDate } from "./studyplan";
import type { ChecklistItem, DayValues, RoutineItemDTO } from "./types";

// Pure checklist logic -- no DB, no React -- so it's easy to unit test.
// The per-item progress maths lives in ./progress so client components can
// use it without bundling the whole uni timetable.

// Mandatory session types: always on the list. Plain lectures and
// question hours only show up from 13:00 on (earlier ones are skipped).
const OPTIONAL_UNI_TYPES = ["Lecture", "Question session"];

// Courses where every session is on the list, whatever its type or time
// (Review Jaar 2 PB: the 09:00 kick-off lecture counts).
const ALWAYS_ATTEND_COURSES = ["5102MIEN6Y"];

const ASSESSMENT = /exam|test|resit|presentation/i;
const RESIT = /resit/i;

export function attendsSession(
  s: Pick<UniSession, "type" | "start"> & Partial<Pick<UniSession, "courseCode">>
): boolean {
  // Resits only matter if you need them; they show under "Coming up" instead.
  if (RESIT.test(s.type)) return false;
  if (s.courseCode && ALWAYS_ATTEND_COURSES.includes(s.courseCode)) return true;
  return s.start >= 13 || !OPTIONAL_UNI_TYPES.includes(s.type);
}

export interface Assessment {
  id: string;
  date: string;
  type: string;
  courseName: string;
  start: number;
  location: string;
  resit: boolean;
  note: string;
}

/**
 * Exams, tests, resits and presentations from the timetable, from `today`
 * through `days` days ahead. The timetable doesn't carry homework
 * deadlines -- those live in Canvas -- so this is graded sessions only.
 */
export function upcomingAssessments(
  today: string,
  days = 21,
  sessions: UniSession[] = UNI_SESSIONS
): Assessment[] {
  const until = addDays(today, days);
  return sessions
    .filter((s) => ASSESSMENT.test(s.type) && s.date >= today && s.date <= until)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
    .map((s) => ({
      id: s.id,
      date: s.date,
      type: s.type,
      courseName: s.courseName,
      start: s.start,
      location: s.location,
      resit: RESIT.test(s.type),
      note: s.note,
    }));
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
 * day's uni sessions and any dated study-plan blocks. Sorted by area, then routine order.
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
  return [...fromRoutine, ...uniItemsForDate(date, sessions), ...studyPlanItemsForDate(date)].sort(
    (a, b) => AREA_KEYS.indexOf(a.area) - AREA_KEYS.indexOf(b.area)
  );
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

/** Gym, study and uni each collapse into one row; everything else gets its own. */
function rowKey(item: ChecklistItem): { key: string; label: string } {
  if (item.kind === "gym") return { key: "gym", label: "Gym" };
  if (item.kind === "study") return { key: "study", label: "Study" };
  if (item.area === "uni") return { key: "uni", label: "Uni" };
  return { key: item.key, label: item.label };
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
      const { key, label } = rowKey(item);
      let row = rows.get(key);
      if (!row) {
        row = { key, label, kind: item.kind, cells: [], entries: dates.map(() => []) };
        rows.set(key, row);
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
// gym scheduled 5 days = target 5/week). Derived straight from the week
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
