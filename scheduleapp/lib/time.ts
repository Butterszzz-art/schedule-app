// Time helpers, explicit about the Europe/Amsterdam timezone so the app
// stays correct if the server (or the user) isn't already on CET/CEST —
// e.g. when deployed to Vercel, which runs in UTC.

export const APP_TIME_ZONE = "Europe/Amsterdam";

function getAmsterdamParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  return {
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
    hours: Number(parts.hour),
    minutes: Number(parts.minute),
    seconds: Number(parts.second),
  };
}

/** Today's date in Europe/Amsterdam, as "YYYY-MM-DD". */
export function todayISODate(date: Date = new Date()): string {
  return getAmsterdamParts(date).isoDate;
}

/** Minutes since midnight in Europe/Amsterdam (fractional, includes seconds). */
export function minutesSinceMidnight(date: Date = new Date()): number {
  const { hours, minutes, seconds } = getAmsterdamParts(date);
  return hours * 60 + minutes + seconds / 60;
}

/** ISO 8601 week key for a "YYYY-MM-DD" date string, e.g. "2026-W38". */
export function isoWeekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function formatHM(decimalHours: number): string {
  const totalMins = Math.round(decimalHours * 60);
  const h = Math.floor(((totalMins % (24 * 60)) + 24 * 60) / 60) % 24;
  const m = ((totalMins % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
