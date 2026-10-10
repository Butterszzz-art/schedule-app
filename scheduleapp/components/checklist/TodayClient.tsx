"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { AREAS } from "@/lib/checklist/areas";
import {
  dayScore,
  extrasForDate,
  fraction,
  weekTasksFor,
  type ExtraView,
} from "@/lib/checklist/progress";
import type { ChecklistItem, DayValues, ExtraDTO, ExtraScope, ShiftDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS, dayType, dayKeyForDate } from "@/lib/schedule/days";
import type { ScheduleMode } from "@/lib/schedule/types";
import { ChecklistRow } from "./ChecklistRow";
import { ShiftCard } from "./ShiftCard";
import { TaskSection } from "./TaskSection";

export interface DayNutrition {
  label: string;
  calories: number;
  carbs: number;
  fat: number;
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} failed`);
  return res;
}

function formatLongDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function TodayClient({
  today,
  mode,
  dates,
  itemsByDate,
  initialValues,
  initialExtras,
  initialShifts,
  nutritionByDate,
  countdown,
  comingUp,
}: {
  today: string;
  mode: ScheduleMode;
  dates: string[];
  itemsByDate: Record<string, ChecklistItem[]>;
  initialValues: Record<string, DayValues>;
  initialExtras: ExtraDTO[];
  initialShifts: ShiftDTO[];
  nutritionByDate: Record<string, DayNutrition>;
  countdown: { days: number; name: string } | null;
  comingUp: ReactNode;
}) {
  const [sel, setSel] = useState(today);
  const [values, setValues] = useState(initialValues);
  const [extras, setExtras] = useState(initialExtras);
  const [shifts, setShifts] = useState(initialShifts);

  const items = itemsByDate[sel] ?? [];
  const dayValues = values[sel] ?? {};
  const dayExtras = extrasForDate(extras, sel, today);
  const weekTasks = weekTasksFor(extras, dates[0], dates[0]);
  const { done, total } = dayScore(items, dayValues, dayExtras);
  const nutrition = nutritionByDate[sel];
  const isLowerDay = dayType(dayKeyForDate(sel)) === "lower";

  const setValue = async (date: string, key: string, value: number) => {
    const prev = values[date]?.[key] ?? 0;
    const apply = (v: number) =>
      setValues((all) => ({ ...all, [date]: { ...all[date], [key]: v } }));
    apply(value);
    try {
      await send("/api/checklist", "POST", { date, itemKey: key, value });
    } catch {
      apply(prev);
    }
  };

  const toggleExtra = async (x: ExtraView) => {
    const doneOn = x.doneOn ? null : sel;
    const apply = (d: string | null) =>
      setExtras((all) => all.map((e) => (e.id === x.id ? { ...e, doneOn: d } : e)));
    apply(doneOn);
    try {
      await send(`/api/extras/${x.id}`, "PATCH", { doneOn });
    } catch {
      apply(x.doneOn);
    }
  };

  const deleteExtra = async (id: string) => {
    const previous = extras;
    setExtras((all) => all.filter((e) => e.id !== id));
    try {
      await send(`/api/extras/${id}`, "DELETE");
    } catch {
      setExtras(previous);
    }
  };

  const addExtra = async (label: string, scope: ExtraScope) => {
    try {
      const res = await send("/api/extras", "POST", { date: sel, label, scope });
      const extra: ExtraDTO = await res.json();
      setExtras((all) => [...all, extra]);
      return true;
    } catch {
      return false;
    }
  };

  const addShift = async (shift: Omit<ShiftDTO, "id">) => {
    try {
      const res = await send("/api/shifts", "POST", shift);
      const saved: ShiftDTO = await res.json();
      setShifts((all) =>
        [...all, saved].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      );
      return true;
    } catch {
      return false;
    }
  };

  const deleteShift = async (id: string) => {
    const previous = shifts;
    setShifts((all) => all.filter((s) => s.id !== id));
    try {
      await send(`/api/shifts/${id}`, "DELETE");
    } catch {
      setShifts(previous);
    }
  };

  const selLabel = sel === today ? "today" : DAYS[dates.indexOf(sel)];
  const shortDate = (iso: string) => `${dayKeyForDate(iso)} ${Number(iso.slice(8))}`;

  // Segmented summary bar: one segment per area, sized by item count.
  const segments = [
    ...AREAS.map((a) => ({
      key: a.key,
      color: BLOCK_COLORS[a.kind].accent,
      fractions: items.filter((i) => i.area === a.key).map((i) => fraction(i, dayValues[i.key])),
    })),
    { key: "extra", color: BLOCK_COLORS.free.accent, fractions: dayExtras.map((x) => (x.doneOn ? 1 : 0)) },
  ].filter((s) => s.fractions.length > 0);

  return (
    <>
      <Header title="Today" />
      <main className="flex flex-col gap-5 px-5 pb-6">
        <InstallBanner />

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-foreground/50">
            {mode === "prep" && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-semibold text-accent">Prep</span>
            )}
            {nutrition && (
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-foreground">
                {nutrition.label} · {nutrition.calories} kcal
              </span>
            )}
            {countdown && (
              <span>
                {countdown.days === 0 ? `${countdown.name} today` : `${countdown.days} days to ${countdown.name}`}
              </span>
            )}
          </div>
          <h2 className="text-[28px] font-bold leading-tight tracking-tight">{formatLongDate(sel)}</h2>
        </div>

        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Day of the week">
          {dates.map((date, i) => {
            const score = dayScore(itemsByDate[date] ?? [], values[date] ?? {}, extrasForDate(extras, date, today));
            const pct = score.total ? Math.round((score.done / score.total) * 100) : 0;
            const selected = date === sel;
            return (
              <button
                key={date}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSel(date)}
                className={`flex min-h-[52px] flex-col items-center gap-1 rounded-[10px] pb-2 pt-1.5 text-xs font-semibold text-foreground/50 ${
                  selected ? "bg-[#161616] outline outline-1 outline-[#262626]" : ""
                }`}
              >
                {DAYS[i]}
                <span className={`text-[15px] ${date === today ? "text-accent" : "text-foreground"}`}>
                  {Number(date.slice(8))}
                </span>
                <span className="h-[3px] w-[22px] overflow-hidden rounded-sm bg-[#222]">
                  <span className="block h-full bg-accent" style={{ width: `${date <= today ? pct : 0}%` }} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-card-border bg-[#111] p-4">
          <div className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
            {done}
            <span className="text-[22px] text-foreground/30">/{total}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex h-2 gap-[3px]" aria-hidden>
              {segments.map((s) => {
                const f = s.fractions.reduce((a, b) => a + b, 0) / s.fractions.length;
                return (
                  <span key={s.key} className="relative overflow-hidden rounded-[3px] bg-[#1E1E1E]" style={{ flex: s.fractions.length }}>
                    <span className="absolute inset-y-0 left-0 rounded-[3px]" style={{ width: `${f * 100}%`, background: s.color }} />
                  </span>
                );
              })}
            </div>
            <p className="text-[13px] text-foreground/50">
              {total > 0 && done === total ? (
                <>
                  <strong className="font-semibold text-foreground">All done.</strong> Enjoy the rest of your day.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-foreground">{total - done} left.</strong> Any order, whenever it fits.
                </>
              )}
            </p>
          </div>
        </div>

        {comingUp}

        {AREAS.map((area) => {
          const list = items.filter((i) => i.area === area.key);
          if (list.length === 0) return null;
          const areaDone = list.filter((i) => fraction(i, dayValues[i.key]) === 1).length;
          return (
            <section key={area.key} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: BLOCK_COLORS[area.kind].accent }} />
                  {area.label}
                </h3>
                <span className="text-xs text-foreground/30 tabular-nums">
                  {areaDone}/{list.length}
                </span>
              </div>
              {list.map((item) => (
                <ChecklistRow
                  key={item.key}
                  item={item}
                  value={dayValues[item.key]}
                  hint={
                    item.key === "protein" && nutrition
                      ? `${nutrition.calories} kcal · ${nutrition.carbs} g carbs · ${nutrition.fat} g fat`
                      : undefined
                  }
                  onChange={(v) => setValue(sel, item.key, v)}
                />
              ))}
              {area.key === "body" && isLowerDay && (
                <p className="px-0.5 text-xs text-foreground/50">No cardio today: lower-body day, quads need to recover.</p>
              )}
            </section>
          );
        })}

        <TaskSection
          title={`Also ${selLabel}`}
          tasks={dayExtras}
          placeholder={`Add something for ${selLabel}…`}
          carriedLabel={(from) => `Carried over from ${shortDate(from)}`}
          onToggle={toggleExtra}
          onDelete={deleteExtra}
          onAdd={(label) => addExtra(label, "day")}
        />

        <TaskSection
          title="This week"
          tasks={weekTasks}
          placeholder="Add something for this week…"
          carriedLabel={(from) => `Carried over from week of ${shortDate(from)}`}
          onToggle={toggleExtra}
          onDelete={deleteExtra}
          onAdd={(label) => addExtra(label, "week")}
        />

        <ShiftCard
          date={sel}
          dayLabel={sel === today ? "today" : DAYS[dates.indexOf(sel)]}
          shifts={shifts}
          onAdd={addShift}
          onDelete={deleteShift}
        />

      </main>
    </>
  );
}
