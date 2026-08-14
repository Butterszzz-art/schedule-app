import { dayKeyForDate, dayType, getBlocksForDate } from "./schedule/blocks";
import type { BlockKind, DayKey, SemesterKey } from "./schedule/types";
import { addDays, isoWeekKey } from "./time";

export interface LoggedBlock {
  id: string;
  kind: BlockKind;
  label: string;
  start: number;
  status: "done" | "skipped";
}

export interface DayEntryData {
  date: string;
  dayKey: DayKey;
  isRest: boolean;
  pct: number;
  doneCount: number;
  skippedCount: number;
  unmarkedCount: number;
  totalActive: number;
  loggedBlocks: LoggedBlock[];
  badges: { gym: boolean; ma: boolean; cardio: boolean; study: boolean };
}

/**
 * Builds one DayEntryData per date in `dates` that has at least one
 * DayLog row -- days with nothing logged are omitted entirely (per
 * spec: "Days with zero logged blocks are hidden").
 */
export function buildDayEntries(
  dates: string[],
  semester: SemesterKey,
  logsByDate: Record<string, Record<string, string | null | undefined>>,
  disabledByWeekDay: Set<string> // `${weekKey}:${dayKey}:${blockId}`
): DayEntryData[] {
  const entries: DayEntryData[] = [];

  for (const date of dates) {
    const logsForDate = logsByDate[date];
    if (!logsForDate) continue;

    const dayKey = dayKeyForDate(date);
    const weekKey = isoWeekKey(date);
    const blocks = getBlocksForDate(date, semester).filter(
      (b) => b.kind !== "sleep"
    );

    const activeBlocks = blocks.filter(
      (b) => !disabledByWeekDay.has(`${weekKey}:${dayKey}:${b.id}`)
    );

    const loggedBlocks: LoggedBlock[] = [];
    let doneCount = 0;
    let skippedCount = 0;
    const badges = { gym: false, ma: false, cardio: false, study: false };

    for (const block of blocks) {
      const status = logsForDate[block.id];
      if (status !== "done" && status !== "skipped") continue;

      loggedBlocks.push({
        id: block.id,
        kind: block.kind,
        label: block.label,
        start: block.start,
        status,
      });

      if (status === "done") {
        if (block.kind === "gym") badges.gym = true;
        if (block.kind === "ma") badges.ma = true;
        if (block.kind === "cardio") badges.cardio = true;
        if (block.kind === "study") badges.study = true;
      }
    }

    // Counts for the footer/percentage are scoped to the active (non-
    // disabled) schedule, per spec ("done / non-sleep non-disabled total").
    for (const block of activeBlocks) {
      const status = logsForDate[block.id];
      if (status === "done") doneCount++;
      else if (status === "skipped") skippedCount++;
    }

    if (loggedBlocks.length === 0) continue;

    loggedBlocks.sort((a, b) => a.start - b.start);

    const totalActive = activeBlocks.length;
    const unmarkedCount = Math.max(
      0,
      totalActive - doneCount - skippedCount
    );
    const pct = totalActive === 0 ? 0 : Math.round((doneCount / totalActive) * 100);

    entries.push({
      date,
      dayKey,
      isRest: dayType(dayKey) === "rest",
      pct,
      doneCount,
      skippedCount,
      unmarkedCount,
      totalActive,
      loggedBlocks,
      badges,
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export function lastNDates(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}
