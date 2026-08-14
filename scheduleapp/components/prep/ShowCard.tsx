import { daysUntil, type Show } from "@/lib/prep";

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ShowCard({ show, today }: { show: Show; today: string }) {
  const days = daysUntil(show.date, today);
  const passed = days < 0;
  const isShow1 = show.name.startsWith("Show 1");

  const muted = isShow1 && passed;

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl border border-card-border bg-[#0E0E0E] p-4"
      style={{ opacity: muted ? 0.4 : 1 }}
    >
      <span className="text-sm font-semibold">{show.name}</span>
      <span className="text-xs text-foreground/50">
        {formatDate(show.date)} · {show.venue}
      </span>
      <span className="text-lg font-bold tabular-nums text-accent">
        {passed ? "Passed" : `${days} days`}
      </span>
      <p className="text-xs text-foreground/50">
        {isShow1
          ? "Live rehearsal — test peak week protocol"
          : show.cards
            ? `${show.cards} on the table`
            : null}
      </p>
    </div>
  );
}
