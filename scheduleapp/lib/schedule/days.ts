import type { DayKey } from "./types";

// Mon-first, matching the checklist's day indices (0 = Mon ... 6 = Sun).
export const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 0 = Mon ... 6 = Sun for a "YYYY-MM-DD" date. */
export function dayIndexForDate(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function dayKeyForDate(isoDate: string): DayKey {
  return DAYS[dayIndexForDate(isoDate)];
}
