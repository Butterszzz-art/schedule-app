"use client";

import { CATEGORY_BY_KEY } from "@/lib/tasks/categories";
import type { TaskDTO } from "@/lib/tasks/types";

export function TaskRow({
  task,
  completed = false,
  onToggle,
  onDelete,
  showCheckbox = true,
}: {
  task: TaskDTO;
  completed?: boolean;
  onToggle?: () => void;
  onDelete: () => void;
  showCheckbox?: boolean;
}) {
  const cat = CATEGORY_BY_KEY[task.category];

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{
        backgroundColor: cat.bg,
        borderColor: "#1A1A1A",
        opacity: completed ? 0.7 : 1,
      }}
    >
      {showCheckbox && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={completed ? "Mark as not done" : "Mark as done"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base"
          style={{
            borderColor: completed ? cat.accent : "#2A2A2A",
            color: completed ? cat.accent : "#F0EDE8",
          }}
        >
          {completed ? "✓" : "○"}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            completed ? "text-foreground/40 line-through" : ""
          }`}
        >
          {task.text}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${task.text}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base text-foreground/40"
      >
        ×
      </button>
    </div>
  );
}
