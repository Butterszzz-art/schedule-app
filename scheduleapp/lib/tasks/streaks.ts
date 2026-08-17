import { addDays, isoWeekKey, startOfIsoWeek, todayISODate } from "@/lib/time";
import type { DayKey } from "@/lib/schedule/types";

const DAYS_MON_FIRST: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface DayCell {
  date: string;
  day: DayKey;
  expected: number;
  done: number;
  state: "full" | "partial" | "empty";
}

function cellState(expected: number, done: number): DayCell["state"] {
  if (expected === 0 || done === 0) return "empty";
  return done >= expected ? "full" : "partial";
}

/** The `n` most recent week-start Mondays (ISO date), oldest first. */
export function lastNMondays(n: number, today: string = todayISODate()): string[] {
  const thisMonday = startOfIsoWeek(today);
  const mondays: string[] = [];
  for (let i = 0; i < n; i++) {
    mondays.push(addDays(thisMonday, -7 * i));
  }
  return mondays.reverse();
}

/**
 * Builds one row of 7 day-cells (Mon-Sun) per Monday, using per-(week,day)
 * expected task counts and per-date completion counts. Pure function --
 * easy to test without a DB.
 */
export function buildCalendarGrid(
  mondays: string[],
  expectedByWeekDay: Record<string, Record<string, number>>,
  doneByDate: Record<string, number>
): DayCell[][] {
  return mondays.map((monday) => {
    const wk = isoWeekKey(monday);
    return DAYS_MON_FIRST.map((day, i) => {
      const date = addDays(monday, i);
      const expected = expectedByWeekDay[wk]?.[day] ?? 0;
      const done = doneByDate[date] ?? 0;
      return { date, day, expected, done, state: cellState(expected, done) };
    });
  });
}

/**
 * Current streak of full-completion days, walking backwards from today.
 * Days with zero expected tasks are skipped (don't break the streak).
 * Today itself is skipped rather than breaking the streak if it's not yet
 * fully done -- the day isn't over.
 */
export function currentStreak(
  grid: DayCell[][],
  today: string = todayISODate()
): number {
  const flat = grid.flat().filter((c) => c.date <= today);
  flat.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  let streak = 0;
  for (const cell of flat) {
    if (cell.expected === 0) continue; // no expectation, doesn't break
    if (cell.date === today && cell.done < cell.expected) continue; // in progress
    if (cell.done >= cell.expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
