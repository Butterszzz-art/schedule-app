"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AreaDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { BlockKind } from "@/lib/schedule/types";

const STARTER_AREAS: { label: string; kind: BlockKind }[] = [
  { label: "Health", kind: "gym" },
  { label: "Work", kind: "work" },
  { label: "Learning", kind: "study" },
  { label: "Home", kind: "chores" },
  { label: "Social", kind: "free" },
];

const STARTER_ITEMS: Record<string, string[]> = {
  Health: ["Exercise", "Drink water"],
  Work: ["Deep work block"],
  Learning: ["Read or study"],
  Home: ["Tidy up"],
  Social: ["Reach out to someone"],
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} failed`);
  return res.json();
}

type Step = "welcome" | "areas" | "items";

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [busy, setBusy] = useState(false);

  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set());
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [customAreas, setCustomAreas] = useState<string[]>([]);

  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [itemsOn, setItemsOn] = useState<Record<string, Set<string>>>({});
  const [customItemInput, setCustomItemInput] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<Record<string, string[]>>({});

  const finish = async () => {
    await post("/api/onboarding/complete", {});
    router.push("/today");
  };

  const toggleStarter = (label: string) => {
    setSelectedStarters((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const addCustomArea = () => {
    const label = customAreaInput.trim();
    if (!label || customAreas.includes(label)) return;
    setCustomAreas((all) => [...all, label]);
    setCustomAreaInput("");
  };

  const toAreas = async () => {
    setBusy(true);
    try {
      const picks: { label: string; kind: BlockKind }[] = [
        ...STARTER_AREAS.filter((a) => selectedStarters.has(a.label)),
        ...customAreas.map((label) => ({ label, kind: "free" as BlockKind })),
      ];
      const created: AreaDTO[] = await Promise.all(
        picks.map((p) => post("/api/areas", { label: p.label, kind: p.kind }))
      );
      setAreas(created);
      const initial: Record<string, Set<string>> = {};
      for (const a of created) {
        const suggestions = STARTER_ITEMS[a.label] ?? [];
        initial[a.key] = new Set(suggestions);
      }
      setItemsOn(initial);
      setStep(created.length > 0 ? "items" : "welcome");
      if (created.length === 0) await finish();
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = (areaKey: string, label: string) => {
    setItemsOn((prev) => {
      const set = new Set(prev[areaKey] ?? []);
      if (set.has(label)) set.delete(label);
      else set.add(label);
      return { ...prev, [areaKey]: set };
    });
  };

  const addCustomItem = (areaKey: string) => {
    const label = (customItemInput[areaKey] ?? "").trim();
    if (!label) return;
    setCustomItems((prev) => ({ ...prev, [areaKey]: [...(prev[areaKey] ?? []), label] }));
    setItemsOn((prev) => ({ ...prev, [areaKey]: new Set([...(prev[areaKey] ?? []), label]) }));
    setCustomItemInput((prev) => ({ ...prev, [areaKey]: "" }));
  };

  const finishItems = async () => {
    setBusy(true);
    try {
      const calls: Promise<unknown>[] = [];
      for (const area of areas) {
        for (const label of itemsOn[area.key] ?? []) {
          calls.push(post("/api/routine", { area: area.key, label }));
        }
      }
      await Promise.all(calls);
      await finish();
    } finally {
      setBusy(false);
    }
  };

  if (step === "welcome") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Set up your checklist</h1>
          <p className="text-sm text-foreground/60">
            Pick a few areas of your life to track, and a few things to do in each. You can
            change all of this any time in the Routine tab.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep("areas")}
          className="min-h-[46px] w-full max-w-xs rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A]"
        >
          Get started
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={finish}
          className="text-sm text-foreground/50 underline disabled:opacity-50"
        >
          Skip for now
        </button>
      </main>
    );
  }

  if (step === "areas") {
    return (
      <main className="flex flex-1 flex-col gap-5 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Pick your areas</h2>
          <p className="text-sm text-foreground/60">Choose any that fit, or add your own.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_AREAS.map((a) => {
            const on = selectedStarters.has(a.label);
            return (
              <button
                key={a.label}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStarter(a.label)}
                className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold"
                style={{
                  background: on ? BLOCK_COLORS[a.kind].accent : "transparent",
                  borderColor: on ? BLOCK_COLORS[a.kind].accent : "#2A2A2A",
                  color: on ? "#0A0A0A" : "#F0EDE8CC",
                }}
              >
                {a.label}
              </button>
            );
          })}
          {customAreas.map((label) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold"
              style={{ borderColor: BLOCK_COLORS.free.accent, color: BLOCK_COLORS.free.accent }}
            >
              {label}
            </span>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustomArea();
          }}
        >
          <input
            value={customAreaInput}
            onChange={(e) => setCustomAreaInput(e.target.value)}
            maxLength={60}
            placeholder="Add your own area…"
            className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3.5 text-sm outline-none focus:border-accent"
          />
          <button type="submit" className="min-h-[46px] shrink-0 rounded-xl border border-[#222] px-4 text-sm font-semibold">
            Add
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={toAreas}
          className="mt-auto min-h-[46px] w-full rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A] disabled:opacity-50"
        >
          {busy ? "Setting up…" : "Continue"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={finish}
          className="text-sm text-foreground/50 underline disabled:opacity-50"
        >
          Skip for now
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">What goes in each area?</h2>
        <p className="text-sm text-foreground/60">Turn off anything you don&apos;t want, or add your own.</p>
      </div>

      {areas.map((area) => {
        const suggestions = STARTER_ITEMS[area.label] ?? [];
        const extras = customItems[area.key] ?? [];
        const labels = [...suggestions, ...extras];
        return (
          <section key={area.key} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: BLOCK_COLORS[area.kind].accent }} />
              {area.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const on = itemsOn[area.key]?.has(label) ?? false;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleItem(area.key, label)}
                    className="rounded-full border px-3 py-1.5 text-sm font-medium"
                    style={{
                      background: on ? BLOCK_COLORS[area.kind].accent : "transparent",
                      borderColor: on ? BLOCK_COLORS[area.kind].accent : "#2A2A2A",
                      color: on ? "#0A0A0A" : "#F0EDE8CC",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              {labels.length === 0 && <p className="text-xs text-foreground/40">No suggestions -- add your own below.</p>}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addCustomItem(area.key);
              }}
            >
              <input
                value={customItemInput[area.key] ?? ""}
                onChange={(e) => setCustomItemInput((prev) => ({ ...prev, [area.key]: e.target.value }))}
                maxLength={120}
                placeholder={`Add something for ${area.label}…`}
                className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-[#222] bg-[#141414] px-3 text-sm outline-none focus:border-accent"
              />
              <button type="submit" className="min-h-[42px] shrink-0 rounded-xl border border-[#222] px-3.5 text-sm font-semibold">
                Add
              </button>
            </form>
          </section>
        );
      })}

      <button
        type="button"
        disabled={busy}
        onClick={finishItems}
        className="mt-2 min-h-[46px] w-full rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Done"}
      </button>
    </main>
  );
}
