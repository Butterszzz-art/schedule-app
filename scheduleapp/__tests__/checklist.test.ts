import { describe, expect, it } from "vitest";
import { buildWeekRows, itemsForDate, weeklyTargets } from "@/lib/checklist/logic";
import { goalFraction } from "@/lib/checklist/goals";
import { monthKey } from "@/lib/time";
import {
  dayScore,
  extrasForDate,
  fraction,
  fullValue,
  isSkipped,
  SKIPPED,
  weekTasksFor,
} from "@/lib/checklist/progress";
import type { ExtraDTO, RoutineItemDTO } from "@/lib/checklist/types";

// 2026-10-05 is a Monday.
const MON = "2026-10-05";
const TUE = "2026-10-06";
const WED = "2026-10-07";
const FRI = "2026-10-09";
const SAT = "2026-10-10";
const SUN = "2026-10-11";

const AREA_ORDER = ["anchors", "health", "work"];

const fixtureRoutine: RoutineItemDTO[] = [
  { id: "1", key: "wake", area: "anchors", kind: "sleep", label: "Up by 06:30", hint: "", type: "check", target: 1, chunks: [], days: [0, 1, 2, 3, 4, 5, 6], order: 0 },
  { id: "2", key: "exercise", area: "health", kind: "gym", label: "Exercise", hint: "", type: "check", target: 1, chunks: [], days: [0, 2, 4], order: 0 },
  { id: "3", key: "meals", area: "health", kind: "meal", label: "Meals", hint: "", type: "count", target: 3, chunks: [], days: [0, 1, 2, 3, 4, 5, 6], order: 1 },
  { id: "4", key: "deepwork", area: "work", kind: "study", label: "Deep work", hint: "", type: "chunks", target: 1, chunks: ["2h", "1h"], days: [0, 1, 2, 3, 4], order: 0 },
];

const items = (date: string) => itemsForDate(fixtureRoutine, date, AREA_ORDER);
const keys = (date: string) => items(date).map((i) => i.key);

describe("itemsForDate", () => {
  it("only lists items scheduled for that weekday", () => {
    expect(keys(MON)).toEqual(expect.arrayContaining(["wake", "exercise", "meals", "deepwork"]));
    expect(keys(TUE)).not.toContain("exercise");
    expect(keys(SAT)).not.toContain("deepwork");
  });

  it("sorts by area order, then routine order within an area", () => {
    const areas = items(MON).map((i) => i.area);
    expect(areas.indexOf("anchors")).toBe(0);
    expect(areas.lastIndexOf("health")).toBeLessThan(areas.indexOf("work"));
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
    const list = items(FRI);
    const values = { wake: 1, meals: 3, exercise: 1 };
    const extras = extrasForDate(
      [{ id: "x", date: FRI, scope: "day", label: "x", doneOn: FRI }],
      FRI,
      FRI
    );
    expect(dayScore(list, values, extras)).toEqual({ done: 4, total: list.length + 1 });
  });

  it("drops skipped items out of both done and total", () => {
    const list = items(FRI);
    const values = { wake: 1, exercise: SKIPPED };
    expect(dayScore(list, values, [])).toEqual({ done: 1, total: list.length - 1 });
  });
});

describe("isSkipped", () => {
  it("recognises only the skip sentinel", () => {
    expect(isSkipped(SKIPPED)).toBe(true);
    expect(isSkipped(0)).toBe(false);
    expect(isSkipped(1)).toBe(false);
    expect(isSkipped(undefined)).toBe(false);
  });
});

describe("buildWeekRows", () => {
  it("gives each routine item its own row and marks past misses", () => {
    const dates = [MON, TUE, WED, "2026-10-08", FRI, SAT, SUN];
    const itemsByDate = Object.fromEntries(dates.map((d) => [d, items(d)]));
    const valuesByDate = Object.fromEntries(dates.map((d) => [d, {}])) as Record<string, Record<string, number>>;
    valuesByDate[MON] = { exercise: 1 };
    // exercise is scheduled Mon/Wed/Fri; today is Fri, so Wed (no value) is a past miss.
    const rows = buildWeekRows(dates, itemsByDate, valuesByDate, FRI);
    const exercise = rows.find((r) => r.key === "exercise")!;
    expect(exercise.cells).toEqual(["full", "none", "miss", "none", "due", "none", "none"]);
  });

  it("shows an owed cell, not a miss, while the week it was skipped in is still open", () => {
    const dates = [MON, TUE];
    const itemsByDate = Object.fromEntries(dates.map((d) => [d, items(d)]));
    const valuesByDate = Object.fromEntries(dates.map((d) => [d, {}])) as Record<string, Record<string, number>>;
    valuesByDate[MON] = { exercise: SKIPPED };
    const rows = buildWeekRows(dates, itemsByDate, valuesByDate, TUE);
    expect(rows.find((r) => r.key === "exercise")!.cells[0]).toBe("owed");
  });

  it("turns an unresolved owed cell into a miss once that week has ended", () => {
    const dates = [MON, TUE];
    const itemsByDate = Object.fromEntries(dates.map((d) => [d, items(d)]));
    const valuesByDate = Object.fromEntries(dates.map((d) => [d, {}])) as Record<string, Record<string, number>>;
    valuesByDate[MON] = { exercise: SKIPPED };
    const rows = buildWeekRows(dates, itemsByDate, valuesByDate, WED);
    expect(rows.find((r) => r.key === "exercise")!.cells[0]).toBe("miss");
  });
});

describe("weeklyTargets", () => {
  it("derives the target from scheduled days and counts owed separately from done", () => {
    const dates = [MON, TUE, WED, "2026-10-08", FRI, SAT, SUN];
    const itemsByDate = Object.fromEntries(dates.map((d) => [d, items(d)]));
    const valuesByDate = Object.fromEntries(dates.map((d) => [d, {}])) as Record<string, Record<string, number>>;
    valuesByDate[MON] = { exercise: 1 };
    valuesByDate[WED] = { exercise: SKIPPED };
    // today is Thu, so the Wed skip is still catchable (owed), not a miss.
    const rows = buildWeekRows(dates, itemsByDate, valuesByDate, "2026-10-08");
    const exercise = weeklyTargets(rows).find((t) => t.key === "exercise")!;
    expect(exercise).toEqual(expect.objectContaining({ target: 3, done: 1, owed: 1 }));
  });
});

describe("weekTasksFor", () => {
  const LAST_MON = "2026-09-28";
  const tasks: ExtraDTO[] = [
    { id: "old", date: LAST_MON, scope: "week", label: "Book physio", doneOn: null },
    { id: "now", date: MON, scope: "week", label: "Edit intro", doneOn: null },
    { id: "done", date: LAST_MON, scope: "week", label: "Order supplies", doneOn: TUE },
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

describe("monthKey", () => {
  it("takes the calendar month off an ISO date", () => {
    expect(monthKey("2026-11-07")).toBe("2026-11");
    expect(monthKey(MON)).toBe("2026-10");
  });
});

describe("goalFraction", () => {
  it("is a plain 0/1 for a target-1 milestone", () => {
    expect(goalFraction({ target: 1, progress: 0 })).toBe(0);
    expect(goalFraction({ target: 1, progress: 1 })).toBe(1);
  });

  it("is a ratio for a counted goal, clamped to 1", () => {
    expect(goalFraction({ target: 4, progress: 1 })).toBe(0.25);
    expect(goalFraction({ target: 4, progress: 10 })).toBe(1);
  });
});
