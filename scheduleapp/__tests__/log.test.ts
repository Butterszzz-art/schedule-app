import { describe, expect, it } from "vitest";
import { buildDayEntries, lastNDates } from "@/lib/log";

// 2026-08-15 = Sat (Upper: gym, mobility, breakfast, lunch, cardio,
// dinner, free -- 7 active blocks). 2026-08-16 = Sun (rest).
describe("buildDayEntries", () => {
  it("omits days with zero logged blocks", () => {
    const entries = buildDayEntries(
      ["2026-08-15", "2026-08-16"],
      1,
      { "2026-08-15": { "s1-sat-gym": "done" } }, // Sun has no entry at all
      new Set()
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2026-08-15");
  });

  it("computes percentage as done / active total, ignoring unlogged blocks in the numerator", () => {
    const entries = buildDayEntries(
      ["2026-08-15"],
      1,
      { "2026-08-15": { "s1-sat-gym": "done" } }, // 1 of 7 active blocks done
      new Set()
    );
    expect(entries[0].totalActive).toBe(7);
    expect(entries[0].doneCount).toBe(1);
    expect(entries[0].pct).toBe(14); // round(1/7 * 100)
  });

  it("counts unmarked as active total minus done minus skipped", () => {
    const entries = buildDayEntries(
      ["2026-08-15"],
      1,
      {
        "2026-08-15": {
          "s1-sat-gym": "done",
          "s1-sat-mobility": "skipped",
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
      ["2026-08-15"],
      1,
      { "2026-08-15": { "s1-sat-gym": "done" } },
      new Set()
    )[0];
    const withOverride = buildDayEntries(
      ["2026-08-15"],
      1,
      { "2026-08-15": { "s1-sat-gym": "done" } },
      new Set(["2026-W33:Sat:s1-sat-cardio"])
    )[0];
    expect(withOverride.totalActive).toBe(withoutOverride.totalActive - 1);
  });

  it("only includes explicitly-logged blocks in loggedBlocks, sorted by time", () => {
    const entries = buildDayEntries(
      ["2026-08-15"],
      1,
      {
        "2026-08-15": {
          "s1-sat-cardio": "done", // 13:30
          "s1-sat-gym": "done", // 06:00
        },
      },
      new Set()
    );
    const ids = entries[0].loggedBlocks.map((b) => b.id);
    expect(ids).toEqual(["s1-sat-gym", "s1-sat-cardio"]);
  });

  it("sets gym/cardio badges only when that kind was marked done", () => {
    const entries = buildDayEntries(
      ["2026-08-15"],
      1,
      { "2026-08-15": { "s1-sat-gym": "done", "s1-sat-cardio": "skipped" } },
      new Set()
    );
    expect(entries[0].badges.gym).toBe(true);
    expect(entries[0].badges.cardio).toBe(false);
  });

  it("sorts entries newest-first", () => {
    const entries = buildDayEntries(
      ["2026-08-13", "2026-08-15", "2026-08-14"],
      1,
      {
        "2026-08-13": { "s1-thu-gym": "done" },
        "2026-08-14": { "s1-fri-gym": "done" },
        "2026-08-15": { "s1-sat-gym": "done" },
      },
      new Set()
    );
    expect(entries.map((e) => e.date)).toEqual([
      "2026-08-15",
      "2026-08-14",
      "2026-08-13",
    ]);
  });
});

describe("lastNDates", () => {
  it("returns n dates ending at (and including) today, newest first", () => {
    const dates = lastNDates("2026-08-15", 5);
    expect(dates).toEqual([
      "2026-08-15",
      "2026-08-14",
      "2026-08-13",
      "2026-08-12",
      "2026-08-11",
    ]);
  });
});
