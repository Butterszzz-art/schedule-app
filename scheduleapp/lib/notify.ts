// With no clock times on the checklist, there's one push per day: an
// evening nudge if anything is still open.

/** Minutes since midnight (Europe/Amsterdam) the nudge goes out: 20:30. */
export const NUDGE_AT_MINUTES = 20 * 60 + 30;

// Dedup key for the NotifiedBlock table (one row per user per day).
export const NUDGE_ID = "evening-nudge";

/**
 * True when `nowMinutes` falls inside the nudge window. The window is a few
 * minutes wide (cron may not tick on the exact minute) -- exactly-once
 * delivery is enforced separately, via NotifiedBlock's unique constraint.
 */
export function isNudgeTime(nowMinutes: number, windowMinutes = 2): boolean {
  return nowMinutes >= NUDGE_AT_MINUTES && nowMinutes < NUDGE_AT_MINUTES + windowMinutes;
}

/** Push body for `left` open items, or null when there's nothing to nudge about. */
export function nudgeBody(left: number): string | null {
  if (left <= 0) return null;
  return left === 1 ? "1 thing left on today's list" : `${left} things left on today's list`;
}
