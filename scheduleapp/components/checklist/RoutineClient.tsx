"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { AREAS, EDITABLE_AREAS } from "@/lib/checklist/areas";
import type { Area, RoutineItemDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS } from "@/lib/schedule/days";
import type { ScheduleMode } from "@/lib/schedule/types";

export function RoutineClient({
  mode,
  initialRoutine,
}: {
  mode: ScheduleMode;
  initialRoutine: RoutineItemDTO[];
}) {
  const [routine, setRoutine] = useState(initialRoutine);
  const [label, setLabel] = useState("");
  const [area, setArea] = useState<Area>(EDITABLE_AREAS[0].key);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleDay = async (item: RoutineItemDTO, day: number) => {
    const days = item.days.includes(day)
      ? item.days.filter((d) => d !== day)
      : [...item.days, day].sort((a, b) => a - b);
    const apply = (next: number[]) =>
      setRoutine((all) => all.map((r) => (r.id === item.id ? { ...r, days: next } : r)));
    apply(days);
    const res = await fetch(`/api/routine/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    }).catch(() => null);
    if (!res?.ok) apply(item.days);
  };

  const remove = async (item: RoutineItemDTO) => {
    const previous = routine;
    setRoutine((all) => all.filter((r) => r.id !== item.id));
    const res = await fetch(`/api/routine/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setRoutine(previous);
  };

  const add = async () => {
    const text = label.trim();
    if (!text) return;
    setBusy(true);
    const res = await fetch("/api/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, area, label: text }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const item: RoutineItemDTO = await res.json();
      setRoutine((all) => [...all, item]);
      setLabel("");
    }
  };

  const reset = async () => {
    setBusy(true);
    const res = await fetch("/api/routine/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).catch(() => null);
    setBusy(false);
    setConfirmReset(false);
    if (res?.ok) {
      const { routine: fresh } = (await res.json()) as { routine: RoutineItemDTO[] };
      setRoutine(fresh);
    }
  };

  return (
    <>
      <Header title="Routine" />
      <main className="flex flex-col gap-5 px-5 pb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[28px] font-bold leading-tight tracking-tight">Your daily list</h2>
          <p className="text-[13px] text-foreground/50">
            Pick which days each item shows up. Changes apply to Today straight away.
            {mode === "prep" ? " This is your prep routine; the normal one takes over after Nov 2." : ""}
          </p>
        </div>

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            id="routine-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            autoComplete="off"
            aria-label="New routine item"
            placeholder="New routine item…"
            className="min-h-[46px] min-w-0 basis-full rounded-xl border border-[#222] bg-[#141414] px-3.5 text-sm outline-none focus:border-accent"
          />
          <select
            id="routine-area"
            value={area}
            onChange={(e) => setArea(e.target.value as Area)}
            aria-label="Area"
            className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3 text-sm outline-none focus:border-accent"
          >
            {EDITABLE_AREAS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="min-h-[46px] shrink-0 rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A] disabled:opacity-50">
            Add, every day
          </button>
        </form>

        {AREAS.filter((a) => a.key !== "uni").map((a) => {
          const list = routine.filter((r) => r.area === a.key);
          if (list.length === 0) return null;
          return (
            <section key={a.key} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: BLOCK_COLORS[a.kind].accent }} />
                {a.label}
              </h3>
              {list.map((item) => {
                const colors = BLOCK_COLORS[item.kind] ?? BLOCK_COLORS.free;
                return (
                  <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-card-border p-3" style={{ background: colors.bg }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="break-words text-[15px] font-semibold">
                          {item.label}
                          {item.type === "chunks" && (
                            <span className="text-xs font-normal text-foreground/50"> ({item.chunks.join(" + ")})</span>
                          )}
                        </span>
                        {item.hint && <span className="text-xs text-foreground/50">{item.hint}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        aria-label={`Remove ${item.label} from routine`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg text-foreground/30"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((d, i) => {
                        const on = item.days.includes(i);
                        return (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={on}
                            aria-label={`${item.label} on ${d}`}
                            onClick={() => toggleDay(item, i)}
                            className="min-h-9 rounded-lg border text-xs font-semibold"
                            style={{
                              background: on ? colors.accent : "transparent",
                              borderColor: on ? colors.accent : "#262626",
                              color: on ? "#0A0A0A" : "#F0EDE84D",
                            }}
                          >
                            {d.slice(0, 2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}

        <p className="text-xs text-foreground/50">
          Uni sessions come from your timetable: anything from 13:00, plus seminars, tutorials, practicals and exams.
        </p>

        {confirmReset ? (
          <div className="flex flex-col gap-2 rounded-xl border border-card-border bg-[#111] p-3">
            <p className="text-sm">Undo all your routine edits and go back to the default list? Your ticks are kept.</p>
            <div className="flex gap-2">
              <button type="button" onClick={reset} disabled={busy} className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-[#0A0A0A] disabled:opacity-50">
                Restore defaults
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="min-h-11 flex-1 rounded-xl border border-[#222] text-sm font-semibold text-foreground/70">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="min-h-11 rounded-xl border border-[#222] text-sm font-semibold text-foreground/70">
            Restore default routine
          </button>
        )}
      </main>
    </>
  );
}
