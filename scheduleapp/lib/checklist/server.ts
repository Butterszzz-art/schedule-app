import { prisma } from "@/lib/db";
import { getScheduleMode } from "@/lib/schedule/mode";
import type { ScheduleMode } from "@/lib/schedule/types";
import { addDays } from "@/lib/time";
import { isArea } from "./areas";
import { DEFAULT_ROUTINE } from "./defaults";
import { itemsForDate } from "./logic";
import type {
  ChecklistItem,
  DayValues,
  ExtraDTO,
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
