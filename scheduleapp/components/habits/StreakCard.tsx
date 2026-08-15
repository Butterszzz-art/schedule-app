import type { HabitCategory, StreakResult } from "@/lib/habits";

function glowStyle(streak: number): { borderColor: string; boxShadow: string } {
  if (streak >= 30) {
    return {
      borderColor: "#FBBF24",
      boxShadow: "0 0 16px 0 #FBBF2440",
    };
  }
  if (streak >= 7) {
    return {
      borderColor: "#4ADE80",
      boxShadow: "0 0 12px 0 #4ADE8033",
    };
  }
  if (streak >= 3) {
    return {
      borderColor: "#C8F060",
      boxShadow: "0 0 8px 0 #C8F06022",
    };
  }
  return { borderColor: "#1A1A1A", boxShadow: "none" };
}

export function StreakCard({
  category,
  result,
}: {
  category: HabitCategory;
  result: StreakResult;
}) {
  const { borderColor, boxShadow } = glowStyle(result.streak);

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border bg-[#0E0E0E] p-4"
      style={{ borderColor, boxShadow }}
    >
      <span className="text-2xl leading-none">{category.icon}</span>
      <span className="text-xs font-semibold text-foreground/60">
        {category.label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums">{result.streak}</span>
        <span className="text-xs text-foreground/50">day streak</span>
      </div>
      <span className="text-[11px] text-foreground/40">
        {result.total} completed · best {result.best}
      </span>
    </div>
  );
}
