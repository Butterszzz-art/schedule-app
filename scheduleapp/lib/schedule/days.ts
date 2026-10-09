import type { DayKey } from "./types";

// Mon-first, matching the checklist's day indices (0 = Mon ... 6 = Sun).
export const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const UPPER_DAYS: DayKey[] = ["Mon", "Thu", "Sat"];
const REST_DAYS: DayKey[] = ["Wed", "Sun"];

export type DayType = "upper" | "lower" | "rest";

/** Upper/lower/lift-vs-rest classification -- constant across both modes. */
export function dayType(day: DayKey): DayType {
  if (UPPER_DAYS.includes(day)) return "upper";
  if (REST_DAYS.includes(day)) return "rest";
  return "lower";
}

/** 0 = Mon ... 6 = Sun for a "YYYY-MM-DD" date. */
export function dayIndexForDate(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function dayKeyForDate(isoDate: string): DayKey {
  return DAYS[dayIndexForDate(isoDate)];
}
