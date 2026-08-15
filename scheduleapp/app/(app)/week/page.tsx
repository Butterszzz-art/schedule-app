import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyForDate } from "@/lib/schedule/blocks";
import { getScheduleMode } from "@/lib/schedule/mode";
import type { SemesterKey } from "@/lib/schedule/types";
import { addDays, isoWeekKey, startOfIsoWeek, todayISODate } from "@/lib/time";
import { WeekClient } from "@/components/week/WeekClient";

export default async function WeekPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = todayISODate();
  const mode = getScheduleMode(today);
  const weekKey = isoWeekKey(today);
  const monday = startOfIsoWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, dayKey: dayKeyForDate(date) };
  });

  const [settings, overrides, logs] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.weekOverride.findMany({
      where: { userId, weekKey, disabled: true },
    }),
    prisma.dayLog.findMany({
      where: { userId, date: { in: weekDates.map((d) => d.date) } },
    }),
  ]);

  const semester = (settings?.semester ?? 1) as SemesterKey;

  const initialDisabledKeys = overrides.map((o) => `${o.dayKey}:${o.blockId}`);

  const logsByDate: Record<string, Record<string, string>> = {};
  for (const log of logs) {
    (logsByDate[log.date] ??= {})[log.blockId] = log.status;
  }

  return (
    <WeekClient
      weekKey={weekKey}
      weekDates={weekDates}
      today={today}
      mode={mode}
      initialSemester={semester}
      initialDisabledKeys={initialDisabledKeys}
      logsByDate={logsByDate}
    />
  );
}
