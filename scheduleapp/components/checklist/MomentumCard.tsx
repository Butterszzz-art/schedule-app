import type { MomentumNode } from "@/lib/checklist/momentum";
import { nodeState } from "@/lib/checklist/momentum";
import type { GoalDTO } from "@/lib/checklist/types";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { BlockKind } from "@/lib/schedule/types";

const RING_R = 64;
const RING_CIRC = 2 * Math.PI * RING_R;

function nodeAccent(kind: MomentumNode["kind"]): string {
  if (kind === "goal") return BLOCK_COLORS.free.accent;
  return BLOCK_COLORS[kind as BlockKind]?.accent ?? BLOCK_COLORS.free.accent;
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="#C8F060" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2c2 3-1 4.5-1 7 0 1.7 1.3 3 3 3s3-1.3 3-3c2 2 3 5 3 7a8 8 0 1 1-16 0c0-4 3-6 4-9 .5 1.5 1 2 2 1-1-2-.5-4.5 2-6Z" />
    </svg>
  );
}

/**
 * This week's momentum: a reward ring for overall weekly completion, a
 * streak pill, a horizontal reward path of nodes (weekly targets + custom
 * weekly goals) that glow as they near their target, and a monthly journey
 * bar underneath for the longer-horizon goals. Owed items (see
 * CatchUpSection) show dimmed on a node's ring instead of counting as done
 * or as a miss, and never break the streak.
 */
export function MomentumCard({
  pct,
  streak,
  best,
  nodes,
  monthGoals,
}: {
  pct: number;
  streak: number;
  best: number;
  nodes: MomentumNode[];
  monthGoals: GoalDTO[];
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = RING_CIRC - (RING_CIRC * clamped) / 100;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
        <span className="h-[7px] w-[7px] rounded-full bg-accent" />
        Momentum
      </h3>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-card-border bg-[#111] p-5">
        <div className="relative h-[152px] w-[152px]">
          <svg width="152" height="152" viewBox="0 0 152 152" className="-rotate-90">
            <circle cx="76" cy="76" r={RING_R} fill="none" stroke="#1E1E1E" strokeWidth="11" />
            <circle
              cx="76"
              cy="76"
              r={RING_R}
              fill="none"
              stroke="#C8F060"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)",
                filter: clamped >= 80 ? "drop-shadow(0 0 8px #C8F060)" : undefined,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold tabular-nums">{clamped}%</span>
            <span className="text-[11px] text-foreground/50">of this week&rsquo;s targets</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold"
          style={{ background: "rgba(200,240,96,0.1)", borderColor: "rgba(200,240,96,0.25)" }}
        >
          <FlameIcon />
          <span style={{ color: "#C8F060" }}>{streak}</span>-day streak
          {best > streak && <span className="font-normal text-foreground/50">&middot; best {best}</span>}
        </div>
      </div>

      {nodes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {nodes.map((n) => {
            const accent = nodeAccent(n.kind);
            const target = Math.max(1, n.target);
            const doneFrac = Math.min(1, n.done / target);
            const owedFrac = Math.min(1, (n.done + n.owed) / target);
            const state = nodeState(n);
            return (
              <div key={n.key} className="flex w-[66px] shrink-0 flex-col items-center gap-1.5">
                <div
                  className={`relative grid h-14 w-14 place-items-center rounded-full ${state === "near" ? "animate-momentum-pulse" : ""}`}
                  style={{
                    background: `conic-gradient(${accent} ${doneFrac * 360}deg, rgba(251,146,60,0.35) ${doneFrac * 360}deg ${owedFrac * 360}deg, #1E1E1E ${owedFrac * 360}deg)`,
                  }}
                >
                  <div className="absolute inset-[5px] grid place-items-center rounded-full bg-[#111]">
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: state === "done" ? accent : "rgba(240,237,232,0.6)" }}
                    >
                      {Math.min(n.done, n.target)}/{n.target}
                    </span>
                  </div>
                  {state === "done" && (
                    <div className="absolute -right-0.5 -top-0.5 grid h-[17px] w-[17px] place-items-center rounded-full" style={{ background: accent }}>
                      <svg viewBox="0 0 24 24" className="h-[10px] w-[10px]" fill="none" stroke="#0A0A0A" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="max-w-[66px] truncate text-center text-[10.5px] text-foreground/50">{n.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <MonthlyJourney goals={monthGoals} />
    </section>
  );
}

function MonthlyJourney({ goals }: { goals: GoalDTO[] }) {
  if (goals.length === 0) return null;
  const target = goals.reduce((s, g) => s + g.target, 0);
  const done = goals.reduce((s, g) => s + Math.min(g.progress, g.target), 0);
  const pct = target > 0 ? (done / target) * 100 : 0;
  const next = goals.find((g) => g.progress < g.target);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#111] p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold">This month&rsquo;s journey</span>
        <span className="tabular-nums text-foreground/50">{Math.round(pct)}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-[#1E1E1E]" style={{ marginBlock: "10px" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%`, transition: "width 1s cubic-bezier(.2,.8,.2,1)" }}
        />
        {goals.map((g, i) => {
          const pos = ((i + 1) / goals.length) * 100;
          const reached = pct >= pos - 1;
          return (
            <span
              key={g.id}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                left: `${pos}%`,
                background: reached ? "#C8F060" : "#0A0A0A",
                borderColor: reached ? "#C8F060" : "#2E2E2E",
                transition: "background .5s, border-color .5s",
              }}
            />
          );
        })}
      </div>
      <p className="text-xs text-foreground/50">
        {next ? (
          <>
            <span className="font-semibold text-foreground">{next.target - next.progress}</span> to go on &ldquo;{next.title}&rdquo; for the next checkpoint.
          </>
        ) : (
          "All checkpoints reached this month."
        )}
      </p>
    </div>
  );
}
