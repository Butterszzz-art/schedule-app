export function WeeklyScore({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <span className="text-5xl font-bold text-accent tabular-nums">{pct}%</span>
      <span className="text-xs text-foreground/50">this week</span>
    </div>
  );
}
