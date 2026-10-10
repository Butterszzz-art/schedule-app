import type { ShiftDTO } from "./types";

// Side-job target per week, in hours.
export const SHIFT_TARGET_LOW = 12;
export const SHIFT_TARGET_HIGH = 16;

export function isHHMM(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Length of a shift in hours. An end at or before the start runs past midnight. */
export function shiftHours(start: string, end: string): number {
  let mins = toMinutes(end) - toMinutes(start);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function totalHours(shifts: Pick<ShiftDTO, "start" | "end">[]): number {
  return Math.round(shifts.reduce((s, x) => s + shiftHours(x.start, x.end), 0) * 100) / 100;
}

/** "4h" / "3.5h" / "2h 15m" */
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `${whole}h`;
  if (mins === 30) return `${whole}.5h`;
  return `${whole}h ${mins}m`;
}
