import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyForDate } from "@/lib/schedule/blocks";
import { isoWeekKey, todayISODate } from "@/lib/time";
import type { TaskDTO } from "@/lib/tasks/types";
import { TasksTodayClient } from "@/components/tasks/TasksTodayClient";

export default async function TasksTodayPage() {
  const session = await auth();
  const userId = session!.user.id;

  const date = todayISODate();
  const dayKey = dayKeyForDate(date);
  const weekKey = isoWeekKey(date);

  const [tasks, completions] = await Promise.all([
    prisma.task.findMany({
      where: { userId, weekKey, dayKey },
      orderBy: { order: "asc" },
    }),
    prisma.taskCompletion.findMany({ where: { userId, date } }),
  ]);

  const completedTaskIds = completions.map((c) => c.taskId);

  const tasksOut: TaskDTO[] = tasks.map((t) => ({
    id: t.id,
    weekKey: t.weekKey,
    dayKey: t.dayKey as TaskDTO["dayKey"],
    category: t.category as TaskDTO["category"],
    text: t.text,
    order: t.order,
  }));

  return (
    <TasksTodayClient
      initialTasks={tasksOut}
      initialCompletedIds={completedTaskIds}
      date={date}
    />
  );
}
