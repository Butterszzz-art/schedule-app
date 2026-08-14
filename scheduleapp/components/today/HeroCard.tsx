import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { TodayBlockView } from "@/lib/schedule/types";
import { formatHM } from "@/lib/time";

export type HeroState =
  | { kind: "now"; block: TodayBlockView; rangeEnd: number }
  | { kind: "coming-up"; block: TodayBlockView; secondsUntil: number }
  | { kind: "all-done" };

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function HeroCard({
  state,
  onPush15,
}: {
  state: HeroState;
  onPush15: () => void;
}) {
  if (state.kind === "all-done") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-card-border bg-[#0E0E0E] p-6 text-center">
        <p className="text-2xl font-bold text-accent">All done today 🎯</p>
      </div>
    );
  }

  const { block } = state;
  const colors = BLOCK_COLORS[block.kind];

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5"
      style={{ borderColor: colors.accent, backgroundColor: colors.bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${colors.accent}14, transparent 70%)`,
        }}
      />
      <div className="relative flex flex-col gap-2">
        {state.kind === "now" ? (
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: colors.accent }}
            />
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: colors.accent }}
            >
              NOW
            </span>
          </div>
        ) : (
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: colors.accent }}
          >
            COMING UP
          </span>
        )}

        <h2 className="text-xl font-bold">{block.label}</h2>

        {state.kind === "now" ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">
              {formatHM(block.start)}–{formatHM(state.rangeEnd)}
            </span>
            <button
              type="button"
              onClick={onPush15}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              +15m
            </button>
          </div>
        ) : (
          <span className="font-mono text-3xl font-bold tabular-nums">
            {formatCountdown(state.secondsUntil)}
          </span>
        )}
      </div>
    </div>
  );
}
