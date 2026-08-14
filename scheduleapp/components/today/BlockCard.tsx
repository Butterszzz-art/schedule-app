import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { TodayBlockView } from "@/lib/schedule/types";
import { formatHM } from "@/lib/time";

const STATUS_ICON: Record<"pending" | "done" | "skipped", string> = {
  pending: "○",
  done: "✓",
  skipped: "✕",
};

export function BlockCard({
  block,
  isCurrent,
  onCycleStatus,
  onPush15,
}: {
  block: TodayBlockView;
  isCurrent: boolean;
  onCycleStatus: () => void;
  onPush15: () => void;
}) {
  const colors = BLOCK_COLORS[block.kind];
  const statusKey = block.status ?? "pending";
  const isDone = block.status === "done";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{
        backgroundColor: block.disabled ? "#0E0E0E" : `${colors.bg}`,
        borderColor: isCurrent ? colors.accent : "#1A1A1A",
        borderLeftWidth: isCurrent ? 4 : 1,
        opacity: block.disabled ? 0.45 : 1,
      }}
    >
      <div className="flex w-14 shrink-0 flex-col text-xs text-foreground/50">
        <span>{formatHM(block.start)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isDone ? "text-foreground/40 line-through" : ""
          }`}
        >
          {block.label}
        </p>
      </div>

      {block.disabled ? (
        <span className="shrink-0 rounded-md border border-card-border px-2 py-1 text-[10px] font-semibold tracking-wide text-foreground/40">
          OFF
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          {isCurrent && (
            <button
              type="button"
              onClick={onPush15}
              className="rounded-md border px-2 py-1 text-[10px] font-semibold"
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              +15m
            </button>
          )}
          <button
            type="button"
            onClick={onCycleStatus}
            aria-label={`Mark ${block.label} as ${
              statusKey === "pending"
                ? "done"
                : statusKey === "done"
                  ? "skipped"
                  : "pending"
            }`}
            className="flex h-7 w-7 items-center justify-center rounded-full border text-sm"
            style={{
              borderColor: isDone ? colors.accent : "#2A2A2A",
              color: isDone ? colors.accent : "#F0EDE8",
            }}
          >
            {STATUS_ICON[statusKey]}
          </button>
        </div>
      )}
    </div>
  );
}
