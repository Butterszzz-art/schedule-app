import { addDays } from "@/lib/time";
import { isAfternoonShift, isLateShift, isMorningShift } from "./availability";
import type { ChecklistItem, ShiftDTO } from "./types";

// Sleep, meal and gym times depend on that day's Albert Heijn shifts.
// The checklist has no clock, so the times live in item labels/hints,
// worked out here from the shifts logged in the Side job card.
// Applies from 2026-10-20 on; earlier days keep their stored labels.

export const DAY_PLAN_FROM = "2026-10-20";

export interface DayPlan {
  wake: string;
  bed: string;
  gym: string;
  meals: string;
}

function plusHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dayPlan(date: string, shifts: Pick<ShiftDTO, "date" | "start">[]): DayPlan {
  const today = shifts.filter((s) => s.date === date);
  const yesterday = addDays(date, -1);
  const lateToday = today.some(isLateShift);
  const lateYesterday = shifts.some((s) => s.date === yesterday && isLateShift(s));
  const morning = today.some(isMorningShift);
  const afternoon = today.some(isAfternoonShift);

  // A late shift means bed at 23:00, so keep 8 h by waking at 07:00 --
  // on the shift day itself and the morning after.
  const late = lateToday || lateYesterday;
  const wake = late ? "07:00" : "05:45";
  const bed = lateToday ? "23:00" : "21:45";

  let gym = "06:00";
  if (morning) gym = "After the shift (~10:30)";
  else if (late) gym = "After 08:00";

  const m1 = morning ? "M1 ~06:15" : `M1 by ${plusHour(wake)}`;
  const m2 = morning ? "M2 ~10:30 after shift" : "M2 12:00";
  let m3 = "M3 15:00";
  let m4 = "M4 18:30";
  let snack = "snack 22:30";
  if (afternoon) {
    m3 = "M3 14:45 (packed)";
    m4 = "M4 19:30 after work";
  }
  if (lateToday) {
    m4 = "M4 17:30–18:00 before work";
    snack = "skyr 22:45 after work";
  }

  return { wake, bed, gym, meals: [m1, m2, m3, m4, snack].join(" · ") };
}

/** Rewrites the sleep, meal and gym lines for `date` with that day's times. */
export function applyDayPlan(
  items: ChecklistItem[],
  date: string,
  shifts: Pick<ShiftDTO, "date" | "start">[]
): ChecklistItem[] {
  if (date < DAY_PLAN_FROM) return items;
  const p = dayPlan(date, shifts);
  return items.map((i) => {
    if (i.key === "wake") return { ...i, label: `Up by ${p.wake}` };
    if (i.key === "bed") return { ...i, label: `Lights out ${p.bed}` };
    if (i.key === "meals") return { ...i, hint: p.meals };
    if (i.kind === "gym") return { ...i, hint: p.gym };
    return i;
  });
}
