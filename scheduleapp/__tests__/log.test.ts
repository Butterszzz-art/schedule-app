import { describe, expect, it } from "vitest";
import { buildDayEntries, lastNDates } from "@/lib/log";

// All dates below are in NORMAL mode (well before the Aug 16, 2026 prep
// window). 2026-07-25 = Sat (Upper: 13 active non-sleep blocks --
// meal-m1, gym, mobility, commute-home, meal-m2, study-1, meal-break,
// study-2, meal-m3, cardio, meal-m4, meal-m5, read). 2026-07-26 = Sun
// (rest). Week key for 2026-07-25 is "2026-W30".
describe("buildDayEntries", () => {
  it("omits days with zero logged blocks", () => {
    const entries = buildDayEntries(
      ["2026-07-25", "2026-07-26"],
      1,
      { "2026-07-25": { "normal1-sat-gym": "done" } }, // Sun has no entry at all
      new Set()
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2026-07-25");
  });

  it("computes percentage as done / active total, ignoring unlogged blocks in the numerator", () => {
    const entries = buildDayEntries(
      ["2026-07-25"],
      1,
      { "2026-07-25": { "normal1-sat-gym": "done" } }, // 1 of 13 active blocks done
      new Set()
    );
    expect(entries[0].totalActive).toBe(13);
    expect(entries[0].doneCount).toBe(1);
    expect(entries[0].pct).toBe(8); // round(1/13 * 100)
  });

  it("counts unmarked as active total minus done minus skipped", () => {
    const entries = buildDayEntries(
      ["2026-07-25"],
      1,
      {
        "2026-07-25": {
          "normal1-sat-gym": "done",
          "normal1-sat-mobility": "skipped",
        },
      },
      new Set()
    );
    const e = entries[0];
    expect(e.doneCount).toBe(1);
    expect(e.skippedCount).toBe(1);
    expect(e.unmarkedCount).toBe(e.totalActive - 2);
  });

  it("excludes disabled blocks from the active total and percentage", () => {
    const withoutOverride = buildDayEntries(
      ["2026-07-25"],
      1,
      { "2026-07-25": { "normal1-sat-gym": "done" } },
      new Set()
    )[0];
    const withOverride = buildDayEntries(
      ["2026-07-25"],
      1,
      { "2026-07-25": { "normal1-sat-gym": "done" } },
      new Set(["2026-W30:Sat:normal1-sat-cardio"])
    )[0];
    expect(withOverride.totalActive).toBe(withoutOverride.totalActive - 1);
  });

  it("only includes explicitly-logged blocks in loggedBlocks, sorted by time", () => {
    const entries = buildDayEntries(
      ["2026-07-25"],
      1,
      {
        "2026-07-25": {
          "normal1-sat-cardio": "done", // 13:30
          "normal1-sat-gym": "done", // 06:30
        },
      },
      new Set()
    );
    const ids = entries[0].loggedBlocks.map((b) => b.id);
    expect(ids).toEqual(["normal1-sat-gym", "normal1-sat-cardio"]);
  });

  it("sets gym/cardio badges only when that kind was marked done", () => {
    const entries = buildDayEntries(
      ["2026-07-25"],
      1,
      {
        "2026-07-25": {
          "normal1-sat-gym": "done",
          "normal1-sat-cardio": "skipped",
        },
      },
      new Set()
    );
    expect(entries[0].badges.gym).toBe(true);
    expect(entries[0].badges.cardio).toBe(false);
  });

  it("sorts entries newest-first", () => {
    const entries = buildDayEntries(
      ["2026-07-23", "2026-07-25", "2026-07-24"],
      1,
      {
        "2026-07-23": { "normal1-thu-gym": "done" },
        "2026-07-24": { "normal1-fri-gym": "done" },
        "2026-07-25": { "normal1-sat-gym": "done" },
      },
      new Set()
    );
    expect(entries.map((e) => e.date)).toEqual([
      "2026-07-25",
      "2026-07-24",
      "2026-07-23",
    ]);
  });
});

describe("lastNDates", () => {
  it("returns n dates ending at (and including) today, newest first", () => {
    const dates = lastNDates("2026-07-25", 5);
    expect(dates).toEqual([
      "2026-07-25",
      "2026-07-24",
      "2026-07-23",
      "2026-07-22",
      "2026-07-21",
    ]);
  });
});
