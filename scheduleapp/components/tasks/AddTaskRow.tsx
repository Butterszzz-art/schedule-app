"use client";

import { useRef, useState } from "react";
import type { CategoryKey } from "@/lib/tasks/categories";

export function AddTaskRow({
  category,
  showSuggestions,
  suggestions,
  onAdd,
}: {
  category: CategoryKey;
  showSuggestions: boolean;
  suggestions: string[];
  onAdd: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={`Add ${category} task…`}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-card-border bg-[#141414] px-4 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={submit}
          className="min-h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-[#0A0A0A]"
        >
          + Add
        </button>
      </div>

      {showSuggestions && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                inputRef.current?.focus();
              }}
              className="min-h-8 rounded-full border border-card-border px-3 text-xs text-foreground/50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
