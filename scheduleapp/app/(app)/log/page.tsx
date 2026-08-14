import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDayEntries, lastNDates } from "@/lib/log";
import type { SemesterKey } from "@/lib/schedule/types";
import { isoWeekKey, todayISODate } from "@/lib/time";
import { Header } from "@/components/layout/Header";
import { LogFeed } from "@/components/log/LogFeed";

export default async function LogPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = todayISODate();
  const dates = lastNDates(today, 30);
  const weekKeys = [...new Set(dates.map((d) => isoWeekKey(d)))];

  const [settings, logs, overrides] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.dayLog.findMany({
      where: { userId, date: { in: dates } },
    }),
    prisma.weekOverride.findMany({
      where: { userId, weekKey: { in: weekKeys }, disabled: true },
    }),
  ]);

  const semester = (settings?.semester ?? 1) as SemesterKey;

  const logsByDate: Record<string, Record<string, string | null | undefined>> = {};
  for (const log of logs) {
    (logsByDate[log.date] ??= {})[log.blockId] = log.status;
  }

  const disabledByWeekDay = new Set(
    overrides.map((o) => `${o.weekKey}:${o.dayKey}:${o.blockId}`)
  );

  const entries = buildDayEntries(dates, semester, logsByDate, disabledByWeekDay);

  return (
    <>
      <Header title="Log" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-foreground/50">
              No history yet. Mark your first block complete in Today.
            </p>
            <Link
              href="/today"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#0A0A0A]"
            >
              Go to Today
            </Link>
          </div>
        ) : (
          <LogFeed entries={entries} />
        )}
      </main>
    </>
  );
}
