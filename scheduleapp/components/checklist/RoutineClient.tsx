"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import type { AreaDTO, RoutineItemDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS } from "@/lib/schedule/days";
import type { BlockKind } from "@/lib/schedule/types";

const KIND_OPTIONS = Object.keys(BLOCK_COLORS) as BlockKind[];

export function RoutineClient({
  areas: initialAreas,
  initialRoutine,
}: {
  areas: AreaDTO[];
  initialRoutine: RoutineItemDTO[];
}) {
  const [areas, setAreas] = useState(initialAreas);
  const [routine, setRoutine] = useState(initialRoutine);
  const [label, setLabel] = useState("");
  const [area, setArea] = useState(initialAreas[0]?.key ?? "");
  const [busy, setBusy] = useState(false);

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editKind, setEditKind] = useState<BlockKind>("free");
  const [newAreaLabel, setNewAreaLabel] = useState("");
  const [newAreaKind, setNewAreaKind] = useState<BlockKind>("free");

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

  const addArea = async () => {
    const text = newAreaLabel.trim();
    if (!text) return;
    setBusy(true);
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: text, kind: newAreaKind }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const created: AreaDTO = await res.json();
      setAreas((all) => [...all, created]);
      setNewAreaLabel("");
      if (!area) setArea(created.key);
    }
  };

  const startEdit = (a: AreaDTO) => {
    setEditingAreaId(a.id);
    setEditLabel(a.label);
    setEditKind(a.kind);
  };

  const saveEdit = async (a: AreaDTO) => {
    const text = editLabel.trim();
    if (!text) return;
    setBusy(true);
    const res = await fetch(`/api/areas/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: text, kind: editKind }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const updated: AreaDTO = await res.json();
      setAreas((all) => all.map((x) => (x.id === a.id ? updated : x)));
      setEditingAreaId(null);
    }
  };

  const move = async (a: AreaDTO, direction: -1 | 1) => {
    const sorted = [...areas].sort((x, y) => x.order - y.order);
    const i = sorted.findIndex((x) => x.id === a.id);
    const j = i + direction;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j];
    const previous = areas;
    setAreas((all) =>
      all.map((x) => {
        if (x.id === a.id) return { ...x, order: other.order };
        if (x.id === other.id) return { ...x, order: a.order };
        return x;
      })
    );
    const [resA, resB] = await Promise.all([
      fetch(`/api/areas/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }).catch(() => null),
      fetch(`/api/areas/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }).catch(() => null),
    ]);
    if (!resA?.ok || !resB?.ok) setAreas(previous);
  };

  const archiveArea = async (a: AreaDTO) => {
    const itemCount = routine.filter((r) => r.area === a.key).length;
    if (itemCount > 0) {
      const ok = window.confirm(
        `${a.label} still has ${itemCount} item${itemCount === 1 ? "" : "s"}. Archiving it will hide ${
          itemCount === 1 ? "that item" : "those items"
        } from Today until you move them to another area. Archive anyway?`
      );
      if (!ok) return;
    }
    const previous = areas;
    setAreas((all) => all.filter((x) => x.id !== a.id));
    const res = await fetch(`/api/areas/${a.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setAreas(previous);
    else if (area === a.key) setArea(areas.find((x) => x.id !== a.id)?.key ?? "");
  };

  const sortedAreas = [...areas].sort((x, y) => x.order - y.order);

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

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">Areas</h3>
          {sortedAreas.length === 0 && (
            <p className="rounded-xl border border-card-border bg-[#111] p-4 text-sm text-foreground/50">
              No areas yet -- add one below to start building a routine.
            </p>
          )}
          {sortedAreas.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2 rounded-xl border border-card-border p-2.5">
              <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: BLOCK_COLORS[a.kind].accent }} />
              {editingAreaId === a.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    maxLength={60}
                    autoFocus
                    className="min-h-9 min-w-0 flex-1 rounded-lg border border-[#222] bg-[#141414] px-2.5 text-sm outline-none focus:border-accent"
                  />
                  <select
                    value={editKind}
                    onChange={(e) => setEditKind(e.target.value as BlockKind)}
                    aria-label="Colour"
                    className="min-h-9 rounded-lg border border-[#222] bg-[#141414] px-1.5 text-xs outline-none"
                  >
                    {KIND_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={busy} onClick={() => saveEdit(a)} className="shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-bold text-[#0A0A0A] disabled:opacity-50">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingAreaId(null)} className="shrink-0 rounded-lg border border-[#222] px-2.5 py-1.5 text-xs font-semibold text-foreground/70">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(a)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
                    {a.label}
                  </button>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(a, -1)}
                    aria-label={`Move ${a.label} up`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm text-foreground/50 disabled:opacity-20"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === sortedAreas.length - 1}
                    onClick={() => move(a, 1)}
                    aria-label={`Move ${a.label} down`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm text-foreground/50 disabled:opacity-20"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveArea(a)}
                    aria-label={`Archive ${a.label}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-foreground/30"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addArea();
            }}
          >
            <input
              value={newAreaLabel}
              onChange={(e) => setNewAreaLabel(e.target.value)}
              maxLength={60}
              placeholder="Add an area…"
              className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3 text-sm outline-none focus:border-accent"
            />
            <select
              value={newAreaKind}
              onChange={(e) => setNewAreaKind(e.target.value as BlockKind)}
              aria-label="Colour"
              className="min-h-[42px] rounded-xl border border-[#222] bg-[#141414] px-2 text-xs outline-none"
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy} className="min-h-[42px] shrink-0 rounded-xl border border-[#222] px-3.5 text-sm font-semibold disabled:opacity-50">
              Add area
            </button>
          </form>
        </section>

        {areas.length > 0 && (
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
              {sortedAreas.map((a) => (
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

        {sortedAreas.map((a) => {
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
