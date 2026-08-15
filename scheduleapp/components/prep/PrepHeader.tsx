import {
  daysUntil,
  nextShow,
  START_WEIGHT,
  TARGET_WEIGHT,
  weeksOut,
  type PrepPhase,
} from "@/lib/prep";

export function PrepHeader({
  today,
  currentPhase,
  currentWeight,
}: {
  today: string;
  currentPhase: PrepPhase | null;
  currentWeight: number | null;
}) {
  const show = nextShow(today);
  const weeks = weeksOut(show.date, today);
  const days = daysUntil(show.date, today);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#0E0E0E] p-4">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            color: currentPhase?.color ?? "#7A7A7A",
            backgroundColor: currentPhase ? `${currentPhase.color}1A` : "#1A1A1A",
          }}
        >
          {currentPhase?.name ?? "No active phase"}
        </span>
        <span className="text-xs text-foreground/50">
          {weeks > 0 ? `${weeks} weeks out` : "Show week"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 py-1">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold tabular-nums">{START_WEIGHT}kg</span>
          <span className="text-[10px] text-foreground/40">start</span>
        </div>
        <span className="text-foreground/30">→</span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold tabular-nums text-accent">
            {currentWeight != null ? `${currentWeight}kg` : "–"}
          </span>
          <span className="text-[10px] text-foreground/40">current</span>
        </div>
        <span className="text-foreground/30">→</span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold tabular-nums">{TARGET_WEIGHT}kg</span>
          <span className="text-[10px] text-foreground/40">target</span>
        </div>
      </div>

      <p className="text-center text-xs text-foreground/50">
        <span className="font-semibold tabular-nums text-foreground/80">
          {Math.max(0, days)} days
        </span>{" "}
        until {show.name}
      </p>
    </div>
  );
}
