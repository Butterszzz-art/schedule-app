"use client";

import { useRef, useState } from "react";
import type { ExtraView } from "@/lib/checklist/progress";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { CheckButton } from "./ChecklistRow";

/** A list of untimed tasks with tick, remove and an add box at the bottom. */
export function TaskSection({
  title,
  tasks,
  placeholder,
  carriedLabel,
  onToggle,
  onDelete,
  onAdd,
}: {
  title: string;
  tasks: ExtraView[];
  placeholder: string;
  carriedLabel: (from: string) => string;
  onToggle: (task: ExtraView) => void;
  onDelete: (id: string) => void;
  onAdd: (label: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = BLOCK_COLORS.free.accent;

  const submit = async () => {
    const label = draft.trim();
    if (!label) return;
    setDraft("");
    if (!(await onAdd(label))) setDraft(label);
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
          {tasks.filter((x) => x.doneOn).length}/{tasks.length}
        </span>
      </div>
      {tasks.map((x) => (
        <div
          key={x.id}
          className="flex min-h-[60px] items-center gap-3 rounded-xl border border-card-border bg-[#0E0E0E] py-2.5 pl-2.5 pr-1.5 transition-opacity"
          style={{ opacity: x.doneOn ? 0.55 : 1 }}
        >
          <CheckButton
            state={x.doneOn ? "done" : "open"}
            accent={accent}
            label={`${x.doneOn ? "Mark not done" : "Mark done"}: ${x.label}`}
            onClick={() => onToggle(x)}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={`break-words text-[15px] font-semibold ${x.doneOn ? "line-through decoration-white/30" : ""}`}>
              {x.label}
            </span>
            {x.carriedFrom && (
              <span className="text-xs font-semibold text-accent">{carriedLabel(x.carriedFrom)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDelete(x.id)}
            aria-label={`Remove ${x.label}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg text-foreground/30"
          >
            ×
          </button>
        </div>
      ))}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
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
        <button type="submit" className="min-h-[46px] shrink-0 rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A]">
          Add
        </button>
      </form>
    </section>
  );
}
