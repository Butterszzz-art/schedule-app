import { prisma } from "@/lib/db";
import { getScheduleMode } from "@/lib/schedule/mode";
import type { ScheduleMode } from "@/lib/schedule/types";
import { addDays } from "@/lib/time";
import { isArea } from "./areas";
import { DEFAULT_ROUTINE } from "./defaults";
import { itemsForDate } from "./logic";
import { dayScore } from "./progress";
import type {
  ChecklistItem,
  DayValues,
  ExtraDTO,
  GoalDTO,
  GoalScope,
  ItemType,
  RoutineItemDTO,
  ShiftDTO,
} from "./types";

type RoutineRow = Awaited<ReturnType<typeof prisma.routineItem.findMany>>[number];

function toDTO(r: RoutineRow): RoutineItemDTO {
  return {
    id: r.id,
    key: r.key,
    area: isArea(r.area) ? r.area : "life",
    kind: r.kind as RoutineItemDTO["kind"],
    label: r.label,
    hint: r.hint,
    type: r.type as ItemType,
    target: r.target,
    chunks: r.chunks,
    days: r.days,
    order: r.order,
  };
}

/** Writes the default routine for `mode`. createMany + skipDuplicates makes it race-safe. */
export async function seedRoutine(userId: string, mode: ScheduleMode) {
  await prisma.routineItem.createMany({
    data: DEFAULT_ROUTINE[mode].map((d, order) => ({ ...d, userId, mode, order })),
    skipDuplicates: true,
  });
}

/** The user's (non-archived) routine for a mode, seeding the defaults on first use. */
export async function getRoutine(userId: string, mode: ScheduleMode): Promise<RoutineItemDTO[]> {
  let rows = await prisma.routineItem.findMany({
    where: { userId, mode },
    orderBy: { order: "asc" },
  });
  if (rows.length === 0) {
    await seedRoutine(userId, mode);
    rows = await prisma.routineItem.findMany({
      where: { userId, mode },
      orderBy: { order: "asc" },
    });
  }
  return rows.filter((r) => !r.archived).map(toDTO);
}

export interface WeekData {
  dates: string[];
  itemsByDate: Record<string, ChecklistItem[]>;
  valuesByDate: Record<string, DayValues>;
  extras: ExtraDTO[];
  shifts: ShiftDTO[];
}

// How far back an unfinished one-off item keeps rolling over.
const CARRY_OVER_DAYS = 28;

/** Everything the Today and Week views need for the week starting `monday`. */
export async function loadWeek(userId: string, monday: string): Promise<WeekData> {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = dates[6];

  // A week can straddle the prep/normal boundary, so load each mode it touches.
  const modes = [...new Set(dates.map(getScheduleMode))];
  const routines = Object.fromEntries(
    await Promise.all(modes.map(async (m) => [m, await getRoutine(userId, m)] as const))
  ) as Partial<Record<ScheduleMode, RoutineItemDTO[]>>;

  const [entries, extras, shifts] = await Promise.all([
    prisma.checklistEntry.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
    }),
    prisma.extraTask.findMany({
      where: {
        userId,
        OR: [
          { date: { gte: addDays(monday, -CARRY_OVER_DAYS), lte: sunday }, doneOn: null },
          { date: { gte: monday, lte: sunday } },
          { doneOn: { gte: monday, lte: sunday } },
        ],
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workShift.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
      orderBy: [{ date: "asc" }, { start: "asc" }],
    }),
  ]);

  const itemsByDate: Record<string, ChecklistItem[]> = {};
  const valuesByDate: Record<string, DayValues> = {};
  for (const date of dates) {
    itemsByDate[date] = itemsForDate(routines[getScheduleMode(date)] ?? [], date);
    valuesByDate[date] = {};
  }
  for (const e of entries) valuesByDate[e.date][e.itemKey] = e.value;

  return {
    dates,
    itemsByDate,
    valuesByDate,
    extras: extras.map((x) => ({
      id: x.id,
      date: x.date,
      scope: x.scope === "week" ? "week" : "day",
      label: x.label,
      doneOn: x.doneOn,
    })),
    shifts: shifts.map((s) => ({ id: s.id, date: s.date, start: s.start, end: s.end, note: s.note })),
  };
}

/** Custom goals for the current ISO week and the current calendar month. */
export async function getGoals(
  userId: string,
  weekPeriod: string,
  monthPeriod: string
): Promise<GoalDTO[]> {
  const rows = await prisma.goal.findMany({
    where: {
      userId,
      OR: [
        { scope: "week", period: weekPeriod },
        { scope: "month", period: monthPeriod },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((g) => ({
    id: g.id,
    scope: g.scope === "month" ? "month" : ("week" as GoalScope),
    period: g.period,
    title: g.title,
    target: g.target,
    progress: g.progress,
  }));
}

// How far back the streak looks for both the current run and the best one.
const STREAK_LOOKBACK_DAYS = 90;

/**
 * Current and best consecutive-day streaks over the last ~90 days. A day
 * counts as "full" when every scheduled routine/uni item was finished or
 * skipped -- dayScore already drops skipped items from that day's own
 * total (see progress.ts), so skipping something today owes it for the
 * week (see buildWeekRows) but never breaks the streak. One-off tasks
 * aren't counted here, just the routine + uni schedule. Today isn't
 * required to be full yet for the current streak -- it just doesn't count
 * until it is.
 */
export async function computeStreak(userId: string, today: string): Promise<{ current: number; best: number }> {
  const start = addDays(today, -STREAK_LOOKBACK_DAYS);
  const dates: string[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) dates.push(d);

  const modes = [...new Set(dates.map(getScheduleMode))];
  const routines = Object.fromEntries(
    await Promise.all(modes.map(async (m) => [m, await getRoutine(userId, m)] as const))
  ) as Partial<Record<ScheduleMode, RoutineItemDTO[]>>;

  const entries = await prisma.checklistEntry.findMany({
    where: { userId, date: { gte: start, lte: today } },
  });
  const valuesByDate: Record<string, DayValues> = {};
  for (const date of dates) valuesByDate[date] = {};
  for (const e of entries) valuesByDate[e.date][e.itemKey] = e.value;

  const fullDay = dates.map((date) => {
    const items = itemsForDate(routines[getScheduleMode(date)] ?? [], date);
    const { done, total } = dayScore(items, valuesByDate[date], []);
    return total === 0 || done === total;
  });

  let current = 0;
  for (let i = fullDay.length - 1; i >= 0; i--) {
    if (fullDay[i]) current++;
    else if (dates[i] === today) continue; // today's still open -- doesn't break it yet
    else break;
  }

  let best = 0;
  let run = 0;
  for (const full of fullDay) {
    run = full ? run + 1 : 0;
    best = Math.max(best, run);
  }

  return { current, best: Math.max(best, current) };
}
