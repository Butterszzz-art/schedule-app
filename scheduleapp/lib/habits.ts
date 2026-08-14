import { getBlocksForDate } from "./schedule/blocks";
import type { BlockKind, SemesterKey } from "./schedule/types";
import { addDays } from "./time";

export interface HabitCategory {
  key: string;
  label: string;
  icon: string;
  kinds: BlockKind[];
}

export const HABIT_CATEGORIES: HabitCategory[] = [
  { key: "gym", label: "Gym", icon: "💪", kinds: ["gym"] },
  { key: "ma", label: "Martial Arts", icon: "🥋", kinds: ["ma"] },
  { key: "cardio", label: "Cardio", icon: "🏃", kinds: ["cardio"] },
  { key: "mobility", label: "Mobility", icon: "🧘", kinds: ["mobility"] },
  { key: "study", label: "Study", icon: "📚", kinds: ["study"] },
  { key: "nutrition", label: "Nutrition", icon: "🍱", kinds: ["meal", "prep"] },
  { key: "reading", label: "Reading", icon: "📖", kinds: ["read"] },
  { key: "chores", label: "Chores", icon: "🧹", kinds: ["chores"] },
];

export type LogsByDate = Record<string, Record<string, string | null | undefined>>;

export interface StreakResult {
  streak: number;
  best: number;
  total: number;
}

/**
 * For each habit category, walks every calendar day from the earliest
 * logged date through today (inclusive), not just days that happen to
 * have a DayLog row -- an expected day with zero logs still breaks the
 * streak, per CLAUDE.md's spec. Today is handled specially: since the
 * day isn't over yet, it can extend a streak but never breaks one.
 */
export function calcStreaks(
  logsByDate: LogsByDate,
  semester: SemesterKey,
  today: string
): Record<string, StreakResult> {
  const results: Record<string, StreakResult> = {};
  for (const cat of HABIT_CATEGORIES) {
    results[cat.key] = { streak: 0, best: 0, total: 0 };
  }

  const loggedDates = Object.keys(logsByDate);
  const earliest = loggedDates.length > 0 ? [...loggedDates].sort()[0] : today;
  const yesterday = addDays(today, -1);

  const applyDay = (date: string, isToday: boolean) => {
    const blocks = getBlocksForDate(date, semester);
    const logsForDate = logsByDate[date] ?? {};
    for (const cat of HABIT_CATEGORIES) {
      const catBlocks = blocks.filter((b) => cat.kinds.includes(b.kind));
      if (catBlocks.length === 0) continue; // not expected today, ignore

      const doneCount = catBlocks.filter(
        (b) => logsForDate[b.id] === "done"
      ).length;
      const r = results[cat.key];
      r.total += doneCount;

      if (doneCount > 0) {
        r.streak += 1;
        r.best = Math.max(r.best, r.streak);
      } else if (!isToday) {
        r.streak = 0;
      }
      // isToday && doneCount === 0: leave streak as-is, day still in progress.
    }
  };

  if (earliest <= yesterday) {
    for (let cursor = earliest; cursor <= yesterday; cursor = addDays(cursor, 1)) {
      applyDay(cursor, false);
    }
  }
  applyDay(today, true);

  return results;
}

export type HeatCellState = "none" | "missed" | "partial" | "full";

export interface HeatCell {
  date: string;
  state: HeatCellState;
  isToday: boolean;
}

/** Last 7 calendar days (today included, as the last column). */
export function heatmapForCategory(
  logsByDate: LogsByDate,
  semester: SemesterKey,
  category: HabitCategory,
  today: string
): HeatCell[] {
  const days: HeatCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const blocks = getBlocksForDate(date, semester).filter((b) =>
      category.kinds.includes(b.kind)
    );
    const logsForDate = logsByDate[date] ?? {};

    let state: HeatCellState;
    if (blocks.length === 0) {
      state = "none";
    } else {
      const doneCount = blocks.filter(
        (b) => logsForDate[b.id] === "done"
      ).length;
      state =
        doneCount === 0 ? "missed" : doneCount === blocks.length ? "full" : "partial";
    }

    days.push({ date, state, isToday: date === today });
  }
  return days;
}

/**
 * Overall completion % across all habit categories for the current ISO
 * week, from Monday through today (future days in the week aren't
 * counted against the score yet since they haven't happened).
 */
export function weeklyScore(
  logsByDate: LogsByDate,
  semester: SemesterKey,
  weekStart: string,
  today: string
): number {
  const categoryKinds = new Set(HABIT_CATEGORIES.flatMap((c) => c.kinds));
  let expected = 0;
  let done = 0;

  for (let cursor = weekStart; cursor <= today; cursor = addDays(cursor, 1)) {
    const blocks = getBlocksForDate(cursor, semester).filter((b) =>
      categoryKinds.has(b.kind)
    );
    const logsForDate = logsByDate[cursor] ?? {};
    expected += blocks.length;
    done += blocks.filter((b) => logsForDate[b.id] === "done").length;
  }

  return expected === 0 ? 0 : Math.round((done / expected) * 100);
}
