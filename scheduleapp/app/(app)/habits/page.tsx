import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcStreaks, weeklyScore, type LogsByDate } from "@/lib/habits";
import type { SemesterKey } from "@/lib/schedule/types";
import { startOfIsoWeek, todayISODate } from "@/lib/time";
import { Header } from "@/components/layout/Header";
import { HeatmapSection } from "@/components/habits/HeatmapSection";
import { StreakGrid } from "@/components/habits/StreakGrid";
import { WeeklyScore } from "@/components/habits/WeeklyScore";

export default async function HabitsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = todayISODate();
  const weekStart = startOfIsoWeek(today);

  const [settings, logs] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.dayLog.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    }),
  ]);

  const semester = (settings?.semester ?? 1) as SemesterKey;

  const logsByDate: LogsByDate = {};
  for (const log of logs) {
    (logsByDate[log.date] ??= {})[log.blockId] = log.status;
  }

  const streaks = calcStreaks(logsByDate, semester, today);
  const pct = weeklyScore(logsByDate, semester, weekStart, today);

  return (
    <>
      <Header title="Habits" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <WeeklyScore pct={pct} />
        <StreakGrid streaks={streaks} />
        <HeatmapSection logsByDate={logsByDate} semester={semester} today={today} />
      </main>
    </>
  );
}
