import { HABIT_CATEGORIES, type StreakResult } from "@/lib/habits";
import { StreakCard } from "./StreakCard";

export function StreakGrid({
  streaks,
}: {
  streaks: Record<string, StreakResult>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {HABIT_CATEGORIES.map((cat) => (
        <StreakCard key={cat.key} category={cat} result={streaks[cat.key]} />
      ))}
    </div>
  );
}
