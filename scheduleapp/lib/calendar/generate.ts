// Generates an RFC 5545 .ics feed from the live schedule -- see
// app/api/calendar/[token]/route.ts. Reuses getBlocksForDate() (the same
// function Today/Week views render from) rather than re-deriving mode/day
// logic here, so prep-mode posing/MA suspension, cardio placement, and
// real per-date uni sessions all come along for free and can't drift from
// what the app itself shows.

import { dayKeyForDate, getBlocksForDate } from "@/lib/schedule/blocks";
import type { BlockKind, ScheduleBlock, SemesterKey } from "@/lib/schedule/types";
import { addDays, formatHM, isoWeekKey, todayISODate } from "@/lib/time";

interface WeekOverrideRow {
  weekKey: string;
  dayKey: string;
  blockId: string;
}

interface GenerateOptions {
  sem: SemesterKey;
  weekOverrides: WeekOverrideRow[];
  userId: string;
}

// Past 1 week + current + next 8 weeks.
const WEEKS_BACK = 1;
const WEEKS_FORWARD = 8;

// Apple Calendar's per-event COLOR/X-APPLE-CALENDAR-COLOR support is
// best-effort (Apple mainly colours by calendar, not by event) -- these
// are a reasonable mapping from CLAUDE.md's block colour map onto the
// small set of names Apple recognises.
const KIND_COLOUR: Record<BlockKind, string> = {
  sleep: "gray",
  meal: "yellow",
  gym: "green",
  ma: "red",
  cardio: "gray",
  mobility: "pink",
  posing: "orange",
  study: "blue",
  uni: "purple",
  commute: "gray",
  prep: "orange",
  chores: "red",
  read: "green",
  free: "green",
  content: "purple",
};

export function generateICS(opts: GenerateOptions): string {
  const { sem, weekOverrides, userId } = opts;
  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Schedule App//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-CALNAME:My Schedule");
  lines.push("X-WR-TIMEZONE:Europe/Amsterdam");
  lines.push("X-WR-CALDESC:Auto-generated from schedule app");
  lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT15M");
  lines.push("X-PUBLISHED-TTL:PT15M");

  // "weekKey:dayKey:blockId" -> disabled. Only the fixed weekly-rhythm
  // blocks are ever overridden (see app/api/overrides/route.ts); uni
  // sessions are keyed by their own dated ids and are never in this set.
  const disabledSet = new Set(
    weekOverrides.map((o) => `${o.weekKey}:${o.dayKey}:${o.blockId}`)
  );

  const today = todayISODate();
  const startDate = addDays(today, -WEEKS_BACK * 7);
  const totalDays = (WEEKS_BACK + WEEKS_FORWARD) * 7 + 7;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const weekKey = isoWeekKey(date);
    const dayKey = dayKeyForDate(date);

    const blocks = getBlocksForDate(date, sem);

    blocks
      .filter((b) => b.kind !== "sleep")
      .filter((b) => !disabledSet.has(`${weekKey}:${dayKey}:${b.id}`))
      .forEach((block) => {
        lines.push(...buildEvent(block, date, userId));
      });
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

const utf8Encoder = new TextEncoder();

/**
 * RFC 5545 §3.1 line folding: no content line may exceed 75 *octets*, and a
 * fold may not split a multi-octet UTF-8 character -- SUMMARY/DESCRIPTION
 * here can contain accented text (uni course names are Dutch, e.g.
 * "Wetenschapsfilosofie") that overflows 75 octets unfolded, which several
 * calendar parsers reject outright rather than truncate. Wraps by UTF-8
 * byte length per code point (not JS string length, which counts UTF-16
 * code units) and reserves one octet on each continuation line for its
 * required leading space.
 */
function foldLine(line: string): string {
  if (utf8Encoder.encode(line).length <= 75) return line;

  const codePoints = Array.from(line);
  let result = "";
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const ch of codePoints) {
    const chBytes = utf8Encoder.encode(ch).length;
    if (currentBytes + chBytes > limit) {
      result += current + "\r\n";
      current = " ";
      currentBytes = 1;
      limit = 74; // 75 minus the leading space's 1 octet
    }
    current += ch;
    currentBytes += chBytes;
  }
  return result + current;
}

function buildEvent(block: ScheduleBlock, date: string, userId: string): string[] {
  const startMins = Math.round(block.start * 60);
  const endMins = startMins + block.dur;

  const dtStart = formatDT(date, startMins);
  const dtEnd = formatDT(date, endMins);
  const dtstamp = formatDTStamp(new Date());
  // date (not weekKey) keeps the uid unique across every occurrence of a
  // recurring weekly block, since block.id itself repeats every week.
  const uid = `${date}-${block.id}-${userId}@scheduleapp`;
  const colour = KIND_COLOUR[block.kind] ?? "gray";
  const endLabel = formatHM(block.start + block.dur / 60);

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Amsterdam:${dtStart}`,
    `DTEND;TZID=Europe/Amsterdam:${dtEnd}`,
    `SUMMARY:${escapeText(block.label)}`,
    `DESCRIPTION:${escapeText(`${block.kind.toUpperCase()} · ${formatHM(block.start)} – ${endLabel}`)}`,
    `CATEGORIES:${escapeText(block.kind)}`,
    `COLOR:${colour}`,
    `X-APPLE-CALENDAR-COLOR:${colour}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];
}

/** "YYYY-MM-DD" + minutes-from-midnight -> "YYYYMMDDTHHMM00" (local, no Z). */
function formatDT(date: string, totalMins: number): string {
  const [y, m, d] = date.split("-");
  const h = String(Math.floor(totalMins / 60)).padStart(2, "0");
  const min = String(totalMins % 60).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

function formatDTStamp(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

// RFC 5545 §3.3.11 text escaping.
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
