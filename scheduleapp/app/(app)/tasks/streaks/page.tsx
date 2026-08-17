import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { TasksSubNav } from "@/components/tasks/TasksSubNav";
import { buildCalendarGrid, currentStreak, lastNMondays } from "@/lib/tasks/streaks";
import { addDays, isoWeekKey } from "@/lib/time";

const DAYS_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const STATE_STYLE: Record<string, { background: string; border: string }> = {
  full: { background: "#C8F060", border: "#C8F060" },
  partial: { background: "#4ADE8044", border: "#4ADE8066" },
  empty: { background: "#141414", border: "#1A1A1A" },
};

export default async function StreaksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const mondays = lastNMondays(4);
  const weekKeys = mondays.map((m) => isoWeekKey(m));

  const tasks = await prisma.task.findMany({
    where: { userId, weekKey: { in: weekKeys } },
    select: { weekKey: true, dayKey: true },
  });

  const expectedByWeekDay: Record<string, Record<string, number>> = {};
  for (const t of tasks) {
    (expectedByWeekDay[t.weekKey] ??= {})[t.dayKey] =
      (expectedByWeekDay[t.weekKey]?.[t.dayKey] ?? 0) + 1;
  }

  const allDates = mondays.flatMap((monday) =>
    DAYS_MON_FIRST.map((_, i) => addDays(monday, i))
  );

  const completions = await prisma.taskCompletion.findMany({
    where: { userId, date: { in: allDates } },
    select: { date: true },
  });
  const doneByDate: Record<string, number> = {};
  for (const c of completions) {
    doneByDate[c.date] = (doneByDate[c.date] ?? 0) + 1;
  }

  const grid = buildCalendarGrid(mondays, expectedByWeekDay, doneByDate);
  const streak = currentStreak(grid);

  return (
    <>
      <Header title="Streaks" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        <TasksSubNav />

        <div className="flex gap-1.5 pl-[52px]">
          {DAYS_MON_FIRST.map((d) => (
            <span
              key={d}
              className="flex-1 text-center text-[10px] font-semibold text-foreground/30"
            >
              {d.slice(0, 1)}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {grid.map((week, i) => (
            <div key={weekKeys[i]} className="flex items-center gap-1.5">
              <span className="w-11 shrink-0 text-[10px] text-foreground/30">
                W{weekKeys[i].split("-W")[1]}
              </span>
              {week.map((cell) => {
                const style = STATE_STYLE[cell.state];
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.done}/${cell.expected}`}
                    className="h-8 flex-1 rounded-lg border"
                    style={{ background: style.background, borderColor: style.border }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-card-border bg-[#0E0E0E] p-4 text-center">
          <p className="text-2xl font-bold text-accent">{streak}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            day streak of full completion days
          </p>
        </div>
      </main>
    </>
  );
}
