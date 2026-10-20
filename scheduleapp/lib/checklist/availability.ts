import { dayIndexForDate } from "@/lib/schedule/days";
import { addDays } from "@/lib/time";
import type { ShiftDTO } from "./types";

// When you're free to work at Albert Heijn. These are availability windows
// to hand to the store, NOT confirmed shifts -- confirmed shifts are logged
// in the Side job card (WorkShift). Applies from 2026-10-20 on.

export interface Slot {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export type Availability =
  | { kind: "none" } // before this plan started
  | { kind: "away"; reason: string }
  | { kind: "slots"; slots: Slot[]; note?: string };

export const AVAILABILITY_FROM = "2026-10-20";

const AFTERNOON: Slot = { start: "16:00", end: "19:00" };
const EVENING: Slot = { start: "19:00", end: "22:30" };
const MORNING: Slot = { start: "07:00", end: "10:00" };

// 0 = Mon ... 6 = Sun
const NORMAL_WEEK: Slot[][] = [
  [AFTERNOON],
  [AFTERNOON],
  [AFTERNOON],
  [AFTERNOON],
  [AFTERNOON, EVENING],
  [MORNING, AFTERNOON],
  [AFTERNOON],
];

const EXCEPTIONS: Record<string, { slots: Slot[]; note?: string }> = {
  "2026-10-20": { slots: [], note: "Exam week" },
  "2026-10-21": { slots: [], note: "Exam week" },
  "2026-10-22": { slots: [], note: "Exam week" },
  "2026-10-23": { slots: [AFTERNOON, EVENING] },
  "2026-10-24": { slots: [MORNING, AFTERNOON] },
  "2026-10-25": { slots: [AFTERNOON] },
  "2026-10-26": { slots: [AFTERNOON] },
  "2026-10-27": { slots: [AFTERNOON] },
  "2026-11-08": { slots: [AFTERNOON] },
  // Uni until 16:45+ (Experimentatie lecture / Leren en Geheugen seminars).
  "2026-11-10": { slots: [], note: "Uni" },
  "2026-11-13": { slots: [], note: "Uni" },
  "2026-11-27": { slots: [], note: "Uni" },
  // Lineaire Algebra exam runs until 16:30.
  "2026-12-16": { slots: [], note: "Exams" },
};

const AWAY_FROM = "2026-10-28";
const AWAY_TO = "2026-11-07";

export function availabilityForDate(date: string): Availability {
  if (date < AVAILABILITY_FROM) return { kind: "none" };
  if (date >= AWAY_FROM && date <= AWAY_TO) {
    return { kind: "away", reason: "Away: Show 2, Madrid" };
  }
  const ex = EXCEPTIONS[date];
  if (ex) return { kind: "slots", ...ex };
  return { kind: "slots", slots: NORMAL_WEEK[dayIndexForDate(date)] };
}

// ── Shift types (used for the day plan and the Fri/Sat rule) ──
export const isLateShift = (s: Pick<ShiftDTO, "start">) => s.start >= "18:30";
export const isMorningShift = (s: Pick<ShiftDTO, "start">) => s.start < "12:00";
export const isAfternoonShift = (s: Pick<ShiftDTO, "start">) =>
  s.start >= "12:00" && s.start < "18:30";

/**
 * Fridays with a late (19:00-22:30) shift followed by a Saturday morning
 * (07:00-10:00) shift -- that pairing breaks the 8 h sleep rule.
 * Returns the Friday dates.
 */
export function lateThenEarlyClashes(shifts: Pick<ShiftDTO, "date" | "start">[]): string[] {
  const out = new Set<string>();
  for (const s of shifts) {
    if (dayIndexForDate(s.date) !== 4 || !isLateShift(s)) continue;
    const sat = addDays(s.date, 1);
    if (shifts.some((x) => x.date === sat && isMorningShift(x))) out.add(s.date);
  }
  return [...out];
}
