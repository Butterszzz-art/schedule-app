"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { getBlocksForDate } from "@/lib/schedule/blocks";
import { getScheduleMode } from "@/lib/schedule/mode";
import type { DayKey, ScheduleMode, SemesterKey } from "@/lib/schedule/types";
import { DayRow } from "./DayRow";
import { ModeHeader } from "./ModeHeader";
import { SemesterToggle } from "./SemesterToggle";

export function WeekClient({
  weekKey,
  weekDates,
  today,
  mode,
  initialSemester,
  initialDisabledKeys,
  logsByDate,
}: {
  weekKey: string;
  weekDates: { date: string; dayKey: DayKey }[];
  today: string;
  mode: ScheduleMode;
  initialSemester: SemesterKey;
  initialDisabledKeys: string[];
  logsByDate: Record<string, Record<string, string | null | undefined>>;
}) {
  const [semester, setSemester] = useState(initialSemester);
  const [disabledKeys, setDisabledKeys] = useState(
    () => new Set(initialDisabledKeys)
  );
  const [expandedDays, setExpandedDays] = useState<Set<DayKey>>(new Set());

  const changeSemester = async (next: SemesterKey) => {
    if (next === semester) return;
    const previous = semester;
    setSemester(next);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: next }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setSemester(previous);
    }
  };

  const toggleBlock = async (
    dayKey: DayKey,
    blockId: string,
    nextDisabled: boolean
  ) => {
    const key = `${dayKey}:${blockId}`;
    const previous = new Set(disabledKeys);
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      if (nextDisabled) next.add(key);
      else next.delete(key);
      return next;
    });

    try {
      const res = await fetch("/api/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekKey,
          dayKey,
          blockId,
          disabled: nextDisabled,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setDisabledKeys(previous);
    }
  };

  const toggleExpand = (dayKey: DayKey) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });
  };

  // Each day's badge reflects that specific date's own mode -- not the
  // page-level `mode` (computed from `today`) -- so a week straddling the
  // Aug 16 prep-mode boundary doesn't mislabel days before/after it.
  const days = useMemo(
    () =>
      weekDates.map(({ date, dayKey }) => ({
        date,
        dayKey,
        dayMode: getScheduleMode(date),
        blocks: getBlocksForDate(date, semester).filter(
          (b) => b.kind !== "sleep"
        ),
      })),
    [weekDates, semester]
  );

  return (
    <>
      <Header title="Week" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        <ModeHeader mode={mode} />
        <SemesterToggle semester={semester} onChange={changeSemester} />
        <div className="flex flex-col gap-2">
          {days.map(({ date, dayKey, dayMode, blocks }) => {
            const disabledIds = new Set(
              [...disabledKeys]
                .filter((k) => k.startsWith(`${dayKey}:`))
                .map((k) => k.slice(dayKey.length + 1))
            );
            return (
              <DayRow
                key={dayKey}
                dayKey={dayKey}
                date={date}
                mode={dayMode}
                blocks={blocks}
                disabledIds={disabledIds}
                statusByBlock={logsByDate[date] ?? {}}
                isToday={date === today}
                isPast={date < today}
                expanded={expandedDays.has(dayKey)}
                onToggleExpand={() => toggleExpand(dayKey)}
                onToggleBlock={(blockId, nextDisabled) =>
                  toggleBlock(dayKey, blockId, nextDisabled)
                }
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
