import { describe, expect, it } from "vitest";
import { DEFAULT_ROUTINE } from "@/lib/checklist/defaults";
import {
  attendsSession,
  buildWeekRows,
  itemsForDate,
  uniItemsForDate,
  upcomingAssessments,
} from "@/lib/checklist/logic";
import { dayScore, extrasForDate, fraction, fullValue, weekTasksFor } from "@/lib/checklist/progress";
import { formatHours, shiftHours, totalHours } from "@/lib/checklist/shifts";
import type { ExtraDTO, RoutineItemDTO } from "@/lib/checklist/types";
import type { UniSession } from "@/lib/schedule/types";

const routine = (mode: "prep" | "normal"): RoutineItemDTO[] =>
  DEFAULT_ROUTINE[mode].map((d, order) => ({ ...d, id: d.key, order }));

const keys = (date: string, mode: "prep" | "normal" = "prep") =>
  itemsForDate(routine(mode), date, []).map((i) => i.key);

// 2026-10-05 is a Monday.
const MON = "2026-10-05";
const TUE = "2026-10-06";
const WED = "2026-10-07";
const FRI = "2026-10-09";
const SAT = "2026-10-10";
const SUN = "2026-10-11";

describe("default routine", () => {
  it("never puts cardio on Tue or Fri, in either mode", () => {
    for (const mode of ["prep", "normal"] as const) {
      const cardio = DEFAULT_ROUTINE[mode].find((i) => i.key === "cardio")!;
      expect(cardio.days).not.toContain(1);
      expect(cardio.days).not.toContain(4);
    }
  });

  it("has posing daily in prep and none in normal mode", () => {
    expect(keys(WED, "prep")).toContain("posing");
    expect(keys(WED, "normal")).not.toContain("posing");
  });

  it("has martial arts on Wed/Sun only in normal mode", () => {
    expect(keys(WED, "normal")).toContain("ma");
    expect(keys(SUN, "normal")).toContain("ma");
    expect(keys(WED, "prep")).not.toContain("ma");
  });

  it("keeps the sleep anchors every day", () => {
    for (const d of [MON, WED, SUN]) {
      expect(keys(d)).toEqual(expect.arrayContaining(["wake", "bed"]));
    }
  });

  it("picks the right gym day and content items", () => {
    expect(keys(MON)).toContain("gym-upper");
    expect(keys(FRI)).toContain("gym-lower");
    expect(keys(WED)).not.toContain("gym-upper");
    expect(keys(TUE)).toContain("web");
    expect(keys(SAT)).toContain("yt");
    expect(keys(SAT)).not.toContain("web");
  });

  it("uses 3 study chunks on rest days and 2 on lift days", () => {
    const study = (d: string) =>
      itemsForDate(routine("prep"), d, []).find((i) => i.kind === "study")!;
    expect(study(WED).chunks).toEqual(["2h", "1.5h", "1h"]);
    expect(study(MON).chunks).toEqual(["2h", "1.5h"]);
  });

  it("sorts items by area", () => {
    const areas = itemsForDate(routine("prep"), MON, []).map((i) => i.area);
    expect(areas.indexOf("anchors")).toBe(0);
    expect(areas.lastIndexOf("body")).toBeLessThan(areas.indexOf("fuel"));
  });
});

describe("uni sessions", () => {
  const session = (over: Partial<UniSession>): UniSession => ({
    id: "s",
    date: MON,
    courseCode: "X",
    courseName: "Lineaire algebra",
    type: "Lecture",
    start: 15,
    end: 16.75,
    location: "SP C0.110",
    note: "",
    ...over,
  });

  it("skips plain lectures before 13:00 but keeps mandatory sessions", () => {
    expect(attendsSession({ type: "Lecture", start: 9 })).toBe(false);
    expect(attendsSession({ type: "Lecture", start: 13 })).toBe(true);
    expect(attendsSession({ type: "Practical", start: 9 })).toBe(true);
    expect(attendsSession({ type: "Question session", start: 10 })).toBe(false);
  });

  it("leaves resits off the daily list", () => {
    expect(attendsSession({ type: "Computer-based resit", start: 13 })).toBe(false);
  });

  it("lists upcoming exams, tests and resits but not lectures", () => {
    const sessions = [
      session({ id: "lec", date: "2026-10-12" }),
      session({ id: "exam", date: "2026-10-20", type: "Computer-based examination" }),
      session({ id: "resit", date: "2026-10-21", type: "Computer-based resit" }),
      session({ id: "far", date: "2026-12-16", type: "Examination" }),
    ];
    const out = upcomingAssessments("2026-10-10", 21, sessions);
    expect(out.map((a) => [a.id, a.resit])).toEqual([
      ["exam", false],
      ["resit", true],
    ]);
  });

  it("turns a session into a uni item with its time and room", () => {
    const [item] = uniItemsForDate(MON, [session({})]);
    expect(item.key).toBe("uni:s");
    expect(item.label).toBe("Lecture: Lineaire algebra");
    expect(item.hint).toBe("15:00–16:45 · SP C0.110");
  });

  it("slots uni items in after Training", () => {
    const items = itemsForDate(routine("prep"), MON, [session({})]);
    const areas = items.map((i) => i.area);
    expect(areas.indexOf("uni")).toBeGreaterThan(areas.lastIndexOf("body"));
    expect(areas.indexOf("uni")).toBeLessThan(areas.indexOf("fuel"));
  });
});

describe("fraction", () => {
  const check = { type: "check" as const, target: 1, chunks: [] };
  const meals = { type: "count" as const, target: 5, chunks: [] };
  const study = { type: "chunks" as const, target: 1, chunks: ["2h", "1.5h"] };

  it("handles plain checks", () => {
    expect(fraction(check, undefined)).toBe(0);
    expect(fraction(check, 1)).toBe(1);
  });

  it("counts meals", () => {
    expect(fraction(meals, 2)).toBeCloseTo(0.4);
    expect(fraction(meals, fullValue(meals))).toBe(1);
  });

  it("reads study chunks as a bitmask", () => {
    expect(fullValue(study)).toBe(0b11);
    expect(fraction(study, 0b10)).toBe(0.5);
    expect(fraction(study, 0b11)).toBe(1);
  });
});

describe("extrasForDate", () => {
  const extras: ExtraDTO[] = [
    { id: "a", date: WED, scope: "day", label: "Email supervisor", doneOn: null },
    { id: "b", date: FRI, scope: "day", label: "Buy rice", doneOn: null },
    { id: "c", date: TUE, scope: "day", label: "Return book", doneOn: WED },
  ];

  it("rolls unfinished items over onto today", () => {
    const today = extrasForDate(extras, FRI, FRI);
    expect(today.map((x) => [x.id, x.carriedFrom])).toEqual([
      ["a", WED],
      ["b", null],
    ]);
  });

  it("does not roll over onto past days", () => {
    expect(extrasForDate(extras, TUE, FRI).map((x) => x.id)).toEqual([]);
  });

  it("shows finished items on the day they were ticked off", () => {
    const wed = extrasForDate(extras, WED, FRI);
    expect(wed.map((x) => x.id).sort()).toEqual(["a", "c"]);
    expect(wed.find((x) => x.id === "c")!.carriedFrom).toBe(TUE);
  });
});

describe("dayScore", () => {
  it("counts finished routine items and one-offs", () => {
    const items = itemsForDate(routine("prep"), FRI, []);
    const values = { wake: 1, meals: 3, posing: 1 };
    const extras = extrasForDate(
      [{ id: "x", date: FRI, scope: "day", label: "x", doneOn: FRI }],
      FRI,
      FRI
    );
    expect(dayScore(items, values, extras)).toEqual({ done: 3, total: items.length + 1 });
  });
});

describe("buildWeekRows", () => {
  it("merges gym days into one row and marks past misses", () => {
    const dates = [MON, TUE, WED, "2026-10-08", FRI, SAT, SUN];
    const itemsByDate = Object.fromEntries(dates.map((d) => [d, itemsForDate(routine("prep"), d, [])]));
    const valuesByDate = Object.fromEntries(dates.map((d) => [d, {}])) as Record<string, Record<string, number>>;
    valuesByDate[MON] = { "gym-upper": 1 };
    const rows = buildWeekRows(dates, itemsByDate, valuesByDate, WED);
    const gym = rows.find((r) => r.key === "gym")!;
    expect(gym.cells).toEqual(["full", "miss", "none", "due", "due", "due", "none"]);
    expect(rows.filter((r) => r.kind === "gym")).toHaveLength(1);
  });
});

describe("weekTasksFor", () => {
  const LAST_MON = "2026-09-28";
  const tasks: ExtraDTO[] = [
    { id: "old", date: LAST_MON, scope: "week", label: "Book physio", doneOn: null },
    { id: "now", date: MON, scope: "week", label: "Edit YouTube intro", doneOn: null },
    { id: "done", date: LAST_MON, scope: "week", label: "Order tan", doneOn: TUE },
    { id: "day", date: MON, scope: "day", label: "Not a week task", doneOn: null },
  ];

  it("shows this week's tasks plus unfinished ones from earlier weeks", () => {
    const out = weekTasksFor(tasks, MON, MON);
    expect(out.map((x) => [x.id, x.carriedFrom])).toEqual([
      ["old", LAST_MON],
      ["done", LAST_MON],
      ["now", null],
    ]);
  });

  it("keeps week tasks out of the daily list", () => {
    expect(extrasForDate(tasks, MON, MON).map((x) => x.id)).toEqual(["day"]);
  });

  it("does not carry tasks into a past week", () => {
    expect(weekTasksFor(tasks, LAST_MON, MON).map((x) => x.id)).toEqual(["old"]);
  });
});

describe("shifts", () => {
  it("counts hours between start and end", () => {
    expect(shiftHours("17:00", "21:30")).toBe(4.5);
  });

  it("handles shifts past midnight", () => {
    expect(shiftHours("22:00", "02:00")).toBe(4);
  });

  it("totals a week and formats it", () => {
    expect(totalHours([{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:15" }])).toBe(7.25);
    expect(formatHours(7.25)).toBe("7h 15m");
    expect(formatHours(3.5)).toBe("3.5h");
    expect(formatHours(4)).toBe("4h");
  });
});
