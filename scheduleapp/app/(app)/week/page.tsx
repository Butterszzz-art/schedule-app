import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { buildWeekRows, type CellState } from "@/lib/checklist/logic";
import { dayScore, extrasForDate } from "@/lib/checklist/progress";
import { loadWeek } from "@/lib/checklist/server";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import { DAYS } from "@/lib/schedule/days";
import { startOfIsoWeek, todayISODate } from "@/lib/time";

function Cell({ state, accent }: { state: CellState; accent: string }) {
  if (state === "none") return <span className="inline-block h-1 w-1 rounded-full bg-[#222]" />;
  const style =
    state === "full"
      ? { background: accent }
      : state === "half"
        ? { background: `linear-gradient(90deg, ${accent} 50%, transparent 50%)`, border: `1.5px solid ${accent}` }
        : { border: `1.5px solid ${state === "miss" ? "#5A2A2A" : "#333"}` };
  const label = { full: "Done", half: "Partly done", miss: "Missed", due: "To do" }[state];
  return <span role="img" aria-label={label} className="inline-block h-3.5 w-3.5 rounded-full align-middle" style={style} />;
}

export default async function WeekPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = todayISODate();
  const week = await loadWeek(userId, startOfIsoWeek(today));
  const rows = buildWeekRows(week.dates, week.itemsByDate, week.valuesByDate, today);

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

  return (
    <>
      <Header title="Week" />
      <main className="flex flex-col gap-4 px-5 pb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[28px] font-bold leading-tight tracking-tight">
            {fmt(week.dates[0], { day: "numeric" })}–{fmt(week.dates[6], { day: "numeric", month: "short" })}
          </h2>
          <p className="text-[13px] text-foreground/50">What got done each day, at a glance.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-card-border bg-[#111]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-[11px] font-semibold text-foreground/50">
                <th className="sr-only">Item</th>
                {week.dates.map((date, i) => (
                  <th key={date} className={`px-1 py-2 text-center font-semibold ${date === today ? "text-accent" : ""}`}>
                    {DAYS[i][0]}
                    <br />
                    {Number(date.slice(8))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#161616]">
                <td className="py-2 pl-3 text-foreground/50">Done</td>
                {week.dates.map((date) => {
                  const { done, total } = dayScore(
                    week.itemsByDate[date],
                    week.valuesByDate[date],
                    extrasForDate(week.extras, date, today)
                  );
                  const future = date > today;
                  return (
                    <td key={date} className={`px-1 py-2 text-center font-bold tabular-nums ${future ? "text-foreground/30" : ""}`}>
                      {future ? "–" : `${Math.round((done / Math.max(1, total)) * 100)}%`}
                    </td>
                  );
                })}
              </tr>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-[#161616]">
                  <td className="max-w-[130px] truncate py-2 pl-3">{row.label}</td>
                  {row.cells.map((state, i) => (
                    <td key={i} className="px-1 py-2 text-center">
                      <Cell state={state} accent={BLOCK_COLORS[row.kind]?.accent ?? "#C8F060"} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-[#161616]">
                <td className="py-2 pl-3">Side job</td>
                {week.dates.map((date) => (
                  <td key={date} className="px-1 py-2 text-center tabular-nums" style={{ color: BLOCK_COLORS.work.accent }}>
                    {week.workByDate[date] ? `${week.workByDate[date]}h` : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 text-xs text-foreground/50">
          {(["full", "half", "miss", "due"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <Cell state={s} accent="#C8F060" />
              {{ full: "Done", half: "Partly", miss: "Missed", due: "Still to do" }[s]}
            </span>
          ))}
        </div>
      </main>
    </>
  );
}
