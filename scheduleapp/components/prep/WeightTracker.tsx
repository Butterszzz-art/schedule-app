"use client";

import { useState } from "react";
import { weightVariance, type WeightTarget } from "@/lib/prep";

export interface WeightEntryView {
  date: string;
  weight: number;
}

function formatShort(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

export function WeightTracker({
  today,
  weeklyTarget,
  initialEntries,
}: {
  today: string;
  weeklyTarget: WeightTarget;
  initialEntries: WeightEntryView[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = entries[0] ?? null;
  const variance = current
    ? weightVariance(current.weight, weeklyTarget.target)
    : null;

  const logWeight = async () => {
    const weight = Number(input);
    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a valid weight");
      return;
    }
    setError(null);
    setIsSaving(true);

    const previous = entries;
    const next = [
      { date: today, weight },
      ...entries.filter((e) => e.date !== today),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));
    setEntries(next);
    setInput("");

    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, weight }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setEntries(previous);
      setError("Couldn't save — try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#0E0E0E] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Weight</span>
        <span className="text-xs text-foreground/50">
          Week target:{" "}
          <span className="font-semibold text-foreground/80">
            {weeklyTarget.target}kg
          </span>
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="kg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-11 w-24 rounded-lg border border-card-border bg-[#141414] px-3 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={logWeight}
          disabled={isSaving || input === ""}
          className="min-h-11 flex-1 rounded-lg bg-accent px-3 text-sm font-semibold text-[#0A0A0A] disabled:opacity-50"
        >
          Log weight
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {variance && (
        <p className="text-xs">
          <span
            className="font-semibold tabular-nums"
            style={{ color: variance.aheadOfSchedule ? "#4ADE80" : "#F87171" }}
          >
            {variance.diff > 0 ? "+" : ""}
            {variance.diff}kg
          </span>{" "}
          <span className="text-foreground/40">
            vs target ({variance.aheadOfSchedule ? "ahead" : "behind"})
          </span>
        </p>
      )}

      {entries.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-card-border pt-2.5">
          {entries.slice(0, 4).map((e) => (
            <div
              key={e.date}
              className="flex justify-between text-xs text-foreground/50"
            >
              <span>{formatShort(e.date)}</span>
              <span className="font-semibold tabular-nums text-foreground/70">{e.weight}kg</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-foreground/35">
        Use weekly average — not single-day readings. React to trends over
        7–10 days.
      </p>
    </div>
  );
}
