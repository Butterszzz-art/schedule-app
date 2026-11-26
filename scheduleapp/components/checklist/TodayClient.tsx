"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import {
  dayScore,
  extrasForDate,
  fraction,
  fullValue,
  isSkipped,
  weekTasksFor,
  type ExtraView,
} from "@/lib/checklist/progress";
import type { AreaDTO, ChecklistItem, DayValues, ExtraDTO, ExtraScope } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS, dayKeyForDate } from "@/lib/schedule/days";
import { CatchUpSection } from "./CatchUpSection";
import { ChecklistRow } from "./ChecklistRow";
import { TaskSection } from "./TaskSection";

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
  areas,
  dates,
  itemsByDate,
  initialValues,
  initialExtras,
}: {
  today: string;
  areas: AreaDTO[];
  dates: string[];
  itemsByDate: Record<string, ChecklistItem[]>;
  initialValues: Record<string, DayValues>;
  initialExtras: ExtraDTO[];
}) {
  const [sel, setSel] = useState(today);
  const [values, setValues] = useState(initialValues);
  const [extras, setExtras] = useState(initialExtras);

  const items = itemsByDate[sel] ?? [];
  const dayValues = values[sel] ?? {};
  const dayExtras = extrasForDate(extras, sel, today);
  const weekTasks = weekTasksFor(extras, dates[0], dates[0]);
  const { done, total } = dayScore(items, dayValues, dayExtras);

  // Items skipped on an earlier day this week that are still owed -- see
  // the "owed" cell state in lib/checklist/logic.ts. Completing one here
  // marks it done on the day it was originally scheduled, not today.
  const catchUps = dates
    .filter((d) => d < today)
    .flatMap((d) =>
      (itemsByDate[d] ?? [])
        .filter((item) => isSkipped(values[d]?.[item.key]))
        .map((item) => ({ date: d, item }))
    );

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

  const selLabel = sel === today ? "today" : DAYS[dates.indexOf(sel)];
  const shortDate = (iso: string) => `${dayKeyForDate(iso)} ${Number(iso.slice(8))}`;

  // Segmented summary bar: one segment per area, sized by item count.
  const segments = [
    ...areas.map((a) => ({
      key: a.key,
      color: BLOCK_COLORS[a.kind].accent,
      fractions: items
        .filter((i) => i.area === a.key && !isSkipped(dayValues[i.key]))
        .map((i) => fraction(i, dayValues[i.key])),
    })),
    { key: "extra", color: BLOCK_COLORS.free.accent, fractions: dayExtras.map((x) => (x.doneOn ? 1 : 0)) },
  ].filter((s) => s.fractions.length > 0);

  return (
    <>
      <Header title="Today" />
      <main className="flex flex-col gap-5 px-5 pb-6">
        <InstallBanner />

        <div className="flex flex-col gap-1.5">
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

        <CatchUpSection
          items={catchUps}
          dayLabel={shortDate}
          onComplete={(date, item) => setValue(date, item.key, fullValue(item))}
        />

        {areas.length === 0 && items.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-[#111] p-4 text-sm text-foreground/50">
            No areas yet. Head to the Routine tab to set up your checklist.
          </p>
        ) : (
          areas.map((area) => {
            const list = items.filter((i) => i.area === area.key);
            if (list.length === 0) return null;
            const activeList = list.filter((i) => !isSkipped(dayValues[i.key]));
            const areaDone = activeList.filter((i) => fraction(i, dayValues[i.key]) === 1).length;
            return (
              <section key={area.key} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
                    <span className="h-[7px] w-[7px] rounded-full" style={{ background: BLOCK_COLORS[area.kind].accent }} />
                    {area.label}
                  </h3>
                  <span className="text-xs text-foreground/30 tabular-nums">
                    {areaDone}/{activeList.length}
                  </span>
                </div>
                {list.map((item) => (
                  <ChecklistRow
                    key={item.key}
                    item={item}
                    value={dayValues[item.key]}
                    onChange={(v) => setValue(sel, item.key, v)}
                  />
                ))}
              </section>
            );
          })
        )}

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
      </main>
    </>
  );
}
