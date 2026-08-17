"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { CATEGORIES, CATEGORY_SUGGESTIONS } from "@/lib/tasks/categories";
import type { TaskDTO } from "@/lib/tasks/types";
import { dayKeyForDate } from "@/lib/schedule/blocks";
import type { DayKey } from "@/lib/schedule/types";
import { addDays, isoWeekKey, startOfIsoWeek, todayISODate } from "@/lib/time";
import { AddTaskRow } from "@/components/tasks/AddTaskRow";
import { CategorySection } from "@/components/tasks/CategorySection";
import { DaySelector } from "@/components/tasks/DaySelector";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TasksSubNav } from "@/components/tasks/TasksSubNav";

const DAYS_MON_FIRST: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateForDay(monday: string, day: DayKey): string {
  return addDays(monday, DAYS_MON_FIRST.indexOf(day));
}

export default function PlanPage() {
  const today = todayISODate();
  const thisMonday = startOfIsoWeek(today);

  const [activeMonday, setActiveMonday] = useState(thisMonday);
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => dayKeyForDate(today));
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [completionsByDate, setCompletionsByDate] = useState<
    Record<string, string[]>
  >({});
  const [loaded, setLoaded] = useState(false);
  const [copying, setCopying] = useState(false);
  // Bumped to force a refetch of the active week (e.g. after "copy from
  // last week") without calling setState synchronously from the effect.
  const [reloadToken, setReloadToken] = useState(0);

  const activeWeekKey = isoWeekKey(activeMonday);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const res = await fetch(`/api/tasks?weekKey=${activeWeekKey}`);
      if (ignore) return;
      if (res.ok) {
        const data = await res.json();
        if (ignore) return;
        setTasks(data.tasks);
        setCompletionsByDate(data.completionsByDate ?? {});
      }
      setLoaded(true);
    })();

    return () => {
      ignore = true;
    };
  }, [activeWeekKey, reloadToken]);

  const addTask = async (category: string, text: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekKey: activeWeekKey,
        dayKey: selectedDay,
        category,
        text,
      }),
    });
    if (res.ok) {
      const task: TaskDTO = await res.json();
      setTasks((prev) => [...prev, task]);
    }
  };

  const deleteTask = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) setTasks(previous);
  };

  const copyFromLastWeek = async () => {
    setCopying(true);
    try {
      const prevWeekKey = isoWeekKey(addDays(activeMonday, -7));
      const res = await fetch(`/api/tasks-week?weekKey=${prevWeekKey}`);
      if (!res.ok) return;
      const { tasks: lastWeekTasks } = (await res.json()) as { tasks: TaskDTO[] };
      for (const t of lastWeekTasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekKey: activeWeekKey,
            dayKey: t.dayKey,
            category: t.category,
            text: t.text,
          }),
        });
      }
      setReloadToken((n) => n + 1);
    } finally {
      setCopying(false);
    }
  };

  const dayCounts: Record<string, number> = {};
  for (const t of tasks) {
    dayCounts[t.dayKey] = (dayCounts[t.dayKey] ?? 0) + 1;
  }

  const tasksForDay = tasks.filter((t) => t.dayKey === selectedDay);

  const totalThisWeek = tasks.length;
  const doneThisWeek = tasks.filter((t) => {
    const date = dateForDay(activeMonday, t.dayKey as DayKey);
    return completionsByDate[date]?.includes(t.id);
  }).length;
  const weekPct =
    totalThisWeek === 0 ? 0 : Math.round((doneThisWeek / totalThisWeek) * 100);

  const showSundayBanner = dayKeyForDate(today) === "Sun" && activeMonday === thisMonday;

  return (
    <>
      <Header title="Plan" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        <TasksSubNav />

        {showSundayBanner && (
          <div className="flex items-center justify-between rounded-xl border border-card-border bg-[#0E0820] p-4">
            <p className="text-sm font-semibold text-[#A78BFA]">
              📋 Week review — plan next week
            </p>
            <button
              type="button"
              onClick={() => setActiveMonday(addDays(activeMonday, 7))}
              className="min-h-11 shrink-0 rounded-lg border border-[#A78BFA55] px-3 text-xs font-semibold text-[#A78BFA]"
            >
              Plan next week →
            </button>
          </div>
        )}

        <p className="text-sm text-foreground/50">
          <span className="font-bold text-accent">{weekPct}%</span> this week
        </p>

        <DaySelector
          selectedDay={selectedDay}
          dayCounts={dayCounts}
          onSelect={setSelectedDay}
        />

        {loaded && (
          <div className="flex flex-col">
            {CATEGORIES.map((cat) => {
              const catTasks = tasksForDay.filter((t) => t.category === cat.key);
              return (
                <CategorySection key={cat.key} category={cat.key} count={catTasks.length}>
                  {catTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showCheckbox={false}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                  <AddTaskRow
                    category={cat.key}
                    showSuggestions={catTasks.length === 0}
                    suggestions={CATEGORY_SUGGESTIONS[cat.key]}
                    onAdd={(text) => addTask(cat.key, text)}
                  />
                </CategorySection>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={copyFromLastWeek}
          disabled={copying}
          className="min-h-11 rounded-xl border border-card-border px-4 text-sm font-semibold text-foreground/70 disabled:opacity-50"
        >
          {copying ? "Copying…" : "Copy from last week"}
        </button>
      </main>
    </>
  );
}
