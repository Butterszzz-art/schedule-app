import { PREP_PHASES } from "@/lib/prep";

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return (b - a) / 86_400_000;
}

function formatShort(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

export function PhaseTimeline({ today }: { today: string }) {
  const rangeStart = PREP_PHASES[0].start;
  const rangeEnd = PREP_PHASES[PREP_PHASES.length - 1].end;
  const totalDays = daysBetween(rangeStart, rangeEnd);

  const todayPct = Math.min(
    100,
    Math.max(0, (daysBetween(rangeStart, today) / totalDays) * 100)
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex h-8 overflow-hidden rounded-lg">
          {PREP_PHASES.map((phase) => {
            const width = (daysBetween(phase.start, phase.end) / totalDays) * 100;
            return (
              <div
                key={phase.name}
                className="flex items-center justify-center text-[9px] font-semibold text-black/70"
                style={{ width: `${width}%`, backgroundColor: phase.color }}
                title={`${phase.name}: ${formatShort(phase.start)} – ${formatShort(phase.end)}`}
              >
                {width > 12 ? phase.name : ""}
              </div>
            );
          })}
        </div>
        {todayPct >= 0 && todayPct <= 100 && (
          <div
            className="absolute -top-4 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${todayPct}%` }}
          >
            <span className="text-[8px] font-bold text-accent">TODAY</span>
            <div className="h-11 w-px bg-accent" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-foreground/40">
        {PREP_PHASES.map((phase) => (
          <span key={phase.name} className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: phase.color }}
            />
            {phase.name} · {formatShort(phase.start)}–{formatShort(phase.end)}
          </span>
        ))}
      </div>
    </div>
  );
}
