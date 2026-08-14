import type { TodayBlockView } from "@/lib/schedule/types";

export function ProgressBar({ blocks }: { blocks: TodayBlockView[] }) {
  const active = blocks.filter((b) => !b.disabled);
  const done = active.filter((b) => b.status === "done").length;
  const total = active.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#141414]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            complete ? "bg-accent" : "bg-foreground/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-foreground/50">
        {done} / {total} done · {pct}%
      </span>
    </div>
  );
}
