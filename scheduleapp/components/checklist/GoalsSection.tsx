"use client";

import { useRef, useState } from "react";
import { goalFraction } from "@/lib/checklist/goals";
import type { GoalDTO, GoalScope } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { CheckButton } from "./ChecklistRow";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} failed`);
  return res;
}

/** Custom goals for one ISO week or one calendar month, ticked up to a target. */
export function GoalsSection({
  title,
  scope,
  period,
  placeholder,
  initialGoals,
}: {
  title: string;
  scope: GoalScope;
  period: string;
  placeholder: string;
  initialGoals: GoalDTO[];
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [draft, setDraft] = useState("");
  const [draftTarget, setDraftTarget] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = BLOCK_COLORS.free.accent;

  const setProgress = async (goal: GoalDTO, progress: number) => {
    const previous = goals;
    setGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, progress } : g)));
    try {
      await send(`/api/goals/${goal.id}`, "PATCH", { progress });
    } catch {
      setGoals(previous);
    }
  };

  const deleteGoal = async (id: string) => {
    const previous = goals;
    setGoals((gs) => gs.filter((g) => g.id !== id));
    try {
      await send(`/api/goals/${id}`, "DELETE");
    } catch {
      setGoals(previous);
    }
  };

  const addGoal = async () => {
    const goalTitle = draft.trim();
    if (!goalTitle) return;
    setDraft("");
    const target = draftTarget;
    setDraftTarget(1);
    try {
      const res = await send("/api/goals", "POST", { scope, period, title: goalTitle, target });
      const goal: GoalDTO = await res.json();
      setGoals((gs) => [...gs, goal]);
    } catch {
      setDraft(goalTitle);
      setDraftTarget(target);
    }
    inputRef.current?.focus();
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: accent }} />
          {title}
        </h3>
        <span className="text-xs text-foreground/30 tabular-nums">
          {goals.filter((g) => goalFraction(g) === 1).length}/{goals.length}
        </span>
      </div>

      {goals.map((g) => {
        const done = goalFraction(g) === 1;
        return (
          <div
            key={g.id}
            className="flex min-h-[60px] items-center gap-3 rounded-xl border border-card-border bg-[#0E0E0E] py-2.5 pl-2.5 pr-1.5 transition-opacity"
            style={{ opacity: done ? 0.55 : 1 }}
          >
            {g.target <= 1 ? (
              <CheckButton
                state={done ? "done" : "open"}
                accent={accent}
                label={`${done ? "Mark not done" : "Mark done"}: ${g.title}`}
                onClick={() => setProgress(g, done ? 0 : 1)}
              />
            ) : (
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 text-xs font-bold tabular-nums"
                style={{ borderColor: done ? accent : "#2E2E2E", color: done ? accent : "#F0EDE880" }}
              >
                {g.progress}/{g.target}
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`break-words text-[15px] font-semibold ${done ? "line-through decoration-white/30" : ""}`}>
                {g.title}
              </span>
              {g.target > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: g.target }, (_, i) => {
                    const on = g.progress > i;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${g.title} step ${i + 1}`}
                        onClick={() => setProgress(g, g.progress === i + 1 ? i : i + 1)}
                        className="h-7 w-7 rounded-full border text-[10px] font-semibold"
                        style={{
                          background: on ? accent : "transparent",
                          borderColor: on ? accent : "#2A2A2A",
                          color: on ? "#0A0A0A" : "#F0EDE880",
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteGoal(g.id)}
              aria-label={`Remove ${g.title}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg text-foreground/30"
            >
              ×
            </button>
          </div>
        );
      })}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addGoal();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          autoComplete="off"
          aria-label={placeholder}
          placeholder={placeholder}
          className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3.5 text-sm outline-none focus:border-accent"
        />
        <input
          value={draftTarget}
          onChange={(e) => setDraftTarget(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          type="number"
          min={1}
          max={20}
          aria-label="Target count"
          title="How many times (1 = a plain milestone)"
          className="min-h-[46px] w-14 shrink-0 rounded-xl border border-[#222] bg-[#141414] px-2 text-center text-sm outline-none focus:border-accent"
        />
        <button type="submit" className="min-h-[46px] shrink-0 rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A]">
          Add
        </button>
      </form>
    </section>
  );
}
