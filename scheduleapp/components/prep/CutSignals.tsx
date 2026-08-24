import { CUT_SIGNALS_RULE, CUT_STOP_SIGNALS } from "@/lib/prep";

export function CutSignals() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="section-label">When to stop cutting</h2>
      <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#0E0E0E] p-3">
        <ul className="flex flex-col gap-2.5">
          {CUT_STOP_SIGNALS.map((signal) => (
            <li key={signal.title} className="text-xs">
              <p className="font-semibold text-foreground/90">{signal.title}</p>
              <p className="mt-0.5 text-foreground/50">{signal.note}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-card-border pt-2.5 text-[10px] text-foreground/40">
          {CUT_SIGNALS_RULE}
        </p>
      </div>
    </div>
  );
}
