import { visibleHabitCategories, type StreakResult } from "@/lib/habits";
import type { ScheduleMode } from "@/lib/schedule/types";
import { StreakCard } from "./StreakCard";

export function StreakGrid({
  streaks,
  mode,
}: {
  streaks: Record<string, StreakResult>;
  mode: ScheduleMode;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {visibleHabitCategories(mode).map((cat) => (
        <StreakCard key={cat.key} category={cat} result={streaks[cat.key]} />
      ))}
    </div>
  );
}
