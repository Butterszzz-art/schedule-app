// With no clock times on the checklist, there's one push per day: an
// evening nudge if anything is still open, at a time each user picks
// in Settings (UserSettings.reminderTime).

// Dedup key for the NotifiedBlock table (one row per user per day).
export const NUDGE_ID = "evening-nudge";

export function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * True when `nowMinutes` falls inside the nudge window starting at
 * `atMinutes`. The window is a few minutes wide (cron may not tick on the
 * exact minute) -- exactly-once delivery is enforced separately, via
 * NotifiedBlock's unique constraint.
 */
export function isNudgeTime(nowMinutes: number, atMinutes: number, windowMinutes = 2): boolean {
  return nowMinutes >= atMinutes && nowMinutes < atMinutes + windowMinutes;
}

/** Push body for `left` open items, or null when there's nothing to nudge about. */
export function nudgeBody(left: number): string | null {
  if (left <= 0) return null;
  return left === 1 ? "1 thing left on today's list" : `${left} things left on today's list`;
}
