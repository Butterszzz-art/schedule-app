import type { DayEntryData } from "@/lib/log";

const BADGES: { key: keyof DayEntryData["badges"]; icon: string }[] = [
  { key: "gym", icon: "💪" },
  { key: "ma", icon: "🥋" },
  { key: "cardio", icon: "🏃" },
  { key: "study", icon: "📚" },
];

export function DaySummaryBadge({
  badges,
}: {
  badges: DayEntryData["badges"];
}) {
  return (
    <div className="flex gap-1">
      {BADGES.map(({ key, icon }) => (
        <span
          key={key}
          className="text-sm"
          style={{ opacity: badges[key] ? 1 : 0.2 }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}
