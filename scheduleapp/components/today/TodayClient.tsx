"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import type { NutritionDayType, NutritionTarget } from "@/lib/nutrition";
import { cascade } from "@/lib/schedule/cascade";
import type { ScheduleBlock, TodayBlockView } from "@/lib/schedule/types";
import { minutesSinceMidnight } from "@/lib/time";
import { BlockCard } from "./BlockCard";
import { HeroCard, type HeroState } from "./HeroCard";
import { NutritionCard } from "./NutritionCard";
import { ProgressBar } from "./ProgressBar";

function toScheduleBlock(b: TodayBlockView): ScheduleBlock {
  return {
    id: b.id,
    kind: b.kind,
    label: b.label,
    start: b.start,
    dur: b.dur,
    fixed: b.fixed,
  };
}

function computeHeroState(
  blocks: TodayBlockView[],
  nowMinutes: number | null
): HeroState {
  if (nowMinutes === null) return { kind: "all-done" };

  const active = blocks.filter((b) => !b.disabled);
  if (active.length === 0 || active.every((b) => b.status !== null)) {
    return { kind: "all-done" };
  }

  if (nowMinutes < active[0].start * 60) {
    return {
      kind: "coming-up",
      block: active[0],
      secondsUntil: (active[0].start * 60 - nowMinutes) * 60,
    };
  }

  let idx = 0;
  for (let i = 0; i < active.length; i++) {
    if (active[i].start * 60 <= nowMinutes) idx = i;
    else break;
  }
  const current = active[idx];
  const next = active[idx + 1];
  const rangeEnd = next ? next.start : current.start + current.dur / 60;
  return { kind: "now", block: current, rangeEnd };
}

export function TodayClient({
  initialBlocks,
  date,
  nutritionDayType,
  nutritionTarget,
}: {
  initialBlocks: TodayBlockView[];
  date: string;
  nutritionDayType: NutritionDayType;
  nutritionTarget: NutritionTarget;
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  // Starts null so the server-rendered markup and the first client render
  // match (avoids a hydration mismatch); resolves to a real value on mount.
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const [shiftingIds, setShiftingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => setNowMinutes(minutesSinceMidnight());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const heroState = useMemo(
    () => computeHeroState(blocks, nowMinutes),
    [blocks, nowMinutes]
  );
  const currentId = heroState.kind === "now" ? heroState.block.id : null;

  const cycleStatus = useCallback(
    async (block: TodayBlockView) => {
      const nextStatus =
        block.status === null
          ? "done"
          : block.status === "done"
            ? "skipped"
            : null;

      const previous = blocks;
      setBlocks((bs) =>
        bs.map((b) => (b.id === block.id ? { ...b, status: nextStatus } : b))
      );

      try {
        const res = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockId: block.id,
            date,
            status: nextStatus,
          }),
        });
        if (!res.ok) throw new Error("Request failed");
      } catch {
        setBlocks(previous);
      }
    },
    [blocks, date]
  );

  const push15 = useCallback(
    async (block: TodayBlockView) => {
      const previous = blocks;
      const sorted = [...blocks].sort((a, b) => a.start - b.start);
      const changedIdx = sorted.findIndex((b) => b.id === block.id);
      if (changedIdx === -1) return;

      const scheduleBlocks = sorted.map(toScheduleBlock);
      const newEndMins = block.start * 60 + block.dur + 15;
      const cascaded = cascade(scheduleBlocks, changedIdx, newEndMins);

      const changedIds = new Set<string>();
      const next = sorted.map((b, i) => {
        const c = cascaded[i];
        if (c.start !== b.start) changedIds.add(b.id);
        return { ...b, start: c.start };
      });

      setShiftingIds(changedIds);
      setBlocks(next);
      window.setTimeout(
        () => setShiftingIds(new Set()),
        300 + changedIds.size * 150
      );

      const toPersist = next.filter((b) => changedIds.has(b.id));
      try {
        const results = await Promise.all(
          toPersist.map((b) =>
            fetch("/api/adjustments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                blockId: b.id,
                date,
                startMins: Math.round(b.start * 60),
              }),
            })
          )
        );
        if (results.some((r) => !r.ok)) throw new Error("Request failed");
      } catch {
        setBlocks(previous);
      }
    },
    [blocks, date]
  );

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.start - b.start),
    [blocks]
  );

  const mealBlocks = useMemo(
    () => sortedBlocks.filter((b) => b.kind === "meal"),
    [sortedBlocks]
  );
  const nextMealId = useMemo(() => {
    if (nowMinutes === null) return null;
    return (
      mealBlocks.find((m) => m.start * 60 > nowMinutes && m.status === null)
        ?.id ?? null
    );
  }, [mealBlocks, nowMinutes]);

  return (
    <>
      <Header title="Today" />
      <main className="flex flex-col gap-4 px-5 pb-4">
        <HeroCard
          state={heroState}
          onPush15={() => {
            if (heroState.kind === "now") push15(heroState.block);
          }}
        />
        <ProgressBar blocks={blocks} />
        <NutritionCard
          dayType={nutritionDayType}
          target={nutritionTarget}
          mealBlocks={mealBlocks}
          nextMealId={nextMealId}
        />
        <div className="flex flex-col gap-2">
          {sortedBlocks.map((block, i) => (
            <div
              key={block.id}
              className={shiftingIds.has(block.id) ? "animate-cascade-shift" : ""}
              style={
                shiftingIds.has(block.id)
                  ? { animationDelay: `${i * 150}ms` }
                  : undefined
              }
            >
              <BlockCard
                block={block}
                isCurrent={block.id === currentId}
                onCycleStatus={() => cycleStatus(block)}
                onPush15={() => push15(block)}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
