import type { Assessment } from "@/lib/checklist/logic";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { formatHM } from "@/lib/time";
import { daysUntil } from "@/lib/prep";

/** Exams, tests and presentations from the timetable in the next few weeks. */
export function ComingUp({ today, assessments }: { today: string; assessments: Assessment[] }) {
  if (assessments.length === 0) return null;
  const { bg, accent } = BLOCK_COLORS.uni;

  return (
    <section aria-label="Coming up at uni" className="flex flex-col gap-2 rounded-xl border border-card-border p-3.5" style={{ background: bg }}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
        Coming up at uni
      </h3>
      <ul className="flex flex-col gap-2">
        {assessments.map((a) => {
          const days = daysUntil(a.date, today);
          return (
            <li key={a.id} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-center text-lg font-bold leading-none tabular-nums" style={{ color: accent }}>
                {days === 0 ? "Today" : `${days}d`}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">
                  {a.courseName}
                  {a.resit && <span className="font-normal text-foreground/50"> (only if needed)</span>}
                </span>
                <span className="text-xs text-foreground/50">
                  {a.type} · {new Date(`${a.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} {formatHM(a.start)}
                  {a.location ? ` · ${a.location}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
