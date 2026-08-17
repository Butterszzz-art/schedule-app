"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { CATEGORIES } from "@/lib/tasks/categories";
import type { TaskDTO } from "@/lib/tasks/types";
import { CategorySection } from "./CategorySection";
import { CompletionCard } from "./CompletionCard";
import { TaskProgressBar } from "./TaskProgressBar";
import { TaskRow } from "./TaskRow";
import { TasksSubNav } from "./TasksSubNav";

export function TasksTodayClient({
  initialTasks,
  initialCompletedIds,
  date,
}: {
  initialTasks: TaskDTO[];
  initialCompletedIds: string[];
  date: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [completed, setCompleted] = useState(new Set(initialCompletedIds));

  const toggleTask = async (taskId: string) => {
    const wasCompleted = completed.has(taskId);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(taskId);
      else next.add(taskId);
      return next;
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.add(taskId);
        else next.delete(taskId);
        return next;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setTasks(previousTasks);
    }
  };

  const doneCount = tasks.filter((t) => completed.has(t.id)).length;
  const total = tasks.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <>
      <Header title="Tasks" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        <TasksSubNav />

        {total > 0 && <TaskProgressBar done={doneCount} total={total} />}

        {total === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-foreground/50">
              No tasks planned for today.
            </p>
            <Link
              href="/tasks/plan"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#0A0A0A]"
            >
              Plan this week →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((cat) => {
              const catTasks = tasks.filter((t) => t.category === cat.key);
              if (catTasks.length === 0) return null;
              return (
                <CategorySection key={cat.key} category={cat.key}>
                  {catTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      completed={completed.has(task.id)}
                      onToggle={() => toggleTask(task.id)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </CategorySection>
              );
            })}

            {allDone && <CompletionCard />}
          </div>
        )}
      </main>
    </>
  );
}
