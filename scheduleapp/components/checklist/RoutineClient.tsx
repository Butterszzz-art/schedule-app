"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import type { AreaDTO, RoutineItemDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS } from "@/lib/schedule/days";

export function RoutineClient({
  areas,
  initialRoutine,
}: {
  areas: AreaDTO[];
  initialRoutine: RoutineItemDTO[];
}) {
  const [routine, setRoutine] = useState(initialRoutine);
  const [label, setLabel] = useState("");
  const [area, setArea] = useState(areas[0]?.key ?? "");
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
    if (!text || !area) return;
    setBusy(true);
    const res = await fetch("/api/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, label: text }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const item: RoutineItemDTO = await res.json();
      setRoutine((all) => [...all, item]);
      setLabel("");
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
          </p>
        </div>

        {areas.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-[#111] p-4 text-sm text-foreground/50">
            No areas yet. Set up your areas to start building a routine.
          </p>
        ) : (
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
              onChange={(e) => setArea(e.target.value)}
              aria-label="Area"
              className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3 text-sm outline-none focus:border-accent"
            >
              {areas.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy} className="min-h-[46px] shrink-0 rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A] disabled:opacity-50">
              Add, every day
            </button>
          </form>
        )}

        {areas.map((a) => {
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
      </main>
    </>
  );
}
