import type { ScheduleMode } from "./types";

// Show-prep window, per CLAUDE.md. Dates are compared as ISO strings
// ("YYYY-MM-DD"), consistent with how dates flow through the rest of the
// app (lib/time.ts's todayISODate() etc.) -- lexicographic string
// comparison is correct for ISO dates, no Date object parsing needed.
export const PREP_START = "2026-08-16";
export const PREP_END = "2026-11-02";

export function getScheduleMode(date: string): ScheduleMode {
  return date >= PREP_START && date <= PREP_END ? "prep" : "normal";
}

export function isPrep(date: string): boolean {
  return getScheduleMode(date) === "prep";
}
