import { PRIORITY_GAPS } from "@/lib/prep";

export function PriorityGaps() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="section-label">Priority gaps</h2>
      {PRIORITY_GAPS.map((gap) => (
        <div
          key={gap.area}
          className="rounded-xl border border-card-border bg-[#0E0E0E] p-3"
        >
          <p className="text-sm font-semibold">{gap.area}</p>
          <p className="mt-0.5 text-xs text-foreground/50">{gap.note}</p>
        </div>
      ))}
    </div>
  );
}
