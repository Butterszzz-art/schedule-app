"use client";

import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { fraction, fullValue } from "@/lib/checklist/progress";
import type { ChecklistItem } from "@/lib/checklist/types";

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#0A0A0A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Round tick button shared by routine rows and one-off rows. */
export function CheckButton({
  state,
  accent,
  label,
  onClick,
}: {
  state: "done" | "partial" | "open";
  accent: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition-colors"
      style={{
        borderColor: state === "open" ? "#2E2E2E" : accent,
        background: state === "done" ? accent : "transparent",
      }}
    >
      {state === "done" && <CheckIcon />}
    </button>
  );
}

export function ChecklistRow({
  item,
  value,
  hint,
  onChange,
}: {
  item: ChecklistItem;
  value: number | undefined;
  hint?: string;
  onChange: (value: number) => void;
}) {
  const colors = BLOCK_COLORS[item.kind] ?? BLOCK_COLORS.free;
  const f = fraction(item, value);
  const state = f === 1 ? "done" : f > 0 ? "partial" : "open";
  const v = value ?? 0;
  const full = fullValue(item);

  return (
    <div
      className="flex min-h-[60px] items-center gap-3 rounded-xl border border-card-border py-2.5 pl-2.5 pr-3 transition-opacity"
      style={{ background: colors.bg, opacity: state === "done" ? 0.55 : 1 }}
    >
      <CheckButton
        state={state}
        accent={colors.accent}
        label={`${state === "done" ? "Mark not done" : "Mark done"}: ${item.label}`}
        onClick={() => onChange(state === "done" ? 0 : full)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-[15px] font-semibold ${state === "done" ? "line-through decoration-white/30" : ""}`}>
          {item.label}
        </span>
        {(hint ?? item.hint) && (
          <span className="text-xs text-foreground/50">{hint ?? item.hint}</span>
        )}

        {item.type === "chunks" && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.chunks.map((c, i) => {
              const on = (v & (1 << i)) !== 0;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${item.label} block ${i + 1}, ${c}`}
                  onClick={() => onChange(v ^ (1 << i))}
                  className="min-h-9 rounded-full border px-3 text-[13px] font-semibold tabular-nums"
                  style={{
                    background: on ? colors.accent : "transparent",
                    borderColor: on ? colors.accent : "#2A2A2A",
                    color: on ? "#0A0A0A" : "#F0EDE880",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {item.type === "count" && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Array.from({ length: item.target }, (_, i) => {
              const on = v > i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Meal ${i + 1}`}
                  onClick={() => onChange(v === i + 1 ? i : i + 1)}
                  className="h-9 w-9 rounded-full border text-[11px] font-semibold"
                  style={{
                    background: on ? colors.accent : "transparent",
                    borderColor: on ? colors.accent : "#2A2A2A",
                    color: on ? "#0A0A0A" : "#F0EDE880",
                  }}
                >
                  M{i + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
