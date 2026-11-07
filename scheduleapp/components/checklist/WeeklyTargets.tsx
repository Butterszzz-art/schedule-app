import type { WeeklyTarget } from "@/lib/checklist/logic";
import { BLOCK_COLORS } from "@/lib/schedule/colors";

/**
 * Read-only progress bars for the routine's own weekly targets (how many
 * days each item is scheduled this week vs. how many it's actually done).
 * "Owed" items are still catchable -- see lib/checklist/logic.ts -- so the
 * target never shrinks just because something got skipped on its day.
 */
export function WeeklyTargets({ targets }: { targets: WeeklyTarget[] }) {
  if (targets.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
        This week&rsquo;s targets
      </h3>
      <div className="flex flex-col gap-2.5 rounded-xl border border-card-border bg-[#111] p-4">
        {targets.map((t) => {
          const accent = BLOCK_COLORS[t.kind]?.accent ?? "#C8F060";
          const pct = Math.round((t.done / t.target) * 100);
          return (
            <div key={t.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold">{t.label}</span>
                <span className="tabular-nums text-foreground/50">
                  {t.done}/{t.target}
                  {t.owed > 0 && (
                    <span className="ml-1.5 font-semibold" style={{ color: "#FB923C" }}>
                      · {t.owed} to catch up
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-[#1E1E1E]">
                {t.owed > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.round(((t.done + t.owed) / t.target) * 100)}%`,
                      background:
                        "repeating-linear-gradient(135deg, #FB923C55 0, #FB923C55 3px, transparent 3px, transparent 6px)",
                    }}
                  />
                )}
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: accent }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
