import { describe, expect, it } from "vitest";
import { buildCalendarGrid, currentStreak, lastNMondays } from "@/lib/tasks/streaks";

describe("lastNMondays", () => {
  it("returns n Mondays oldest-first, ending with this week's Monday", () => {
    const mondays = lastNMondays(4, "2026-08-15"); // Sat, W33 -> Monday 08-10
    expect(mondays).toEqual([
      "2026-07-20",
      "2026-07-27",
      "2026-08-03",
      "2026-08-10",
    ]);
  });
});

describe("buildCalendarGrid", () => {
  it("marks a day 'full' when done >= expected", () => {
    const grid = buildCalendarGrid(
      ["2026-08-10"],
      { "2026-W33": { Mon: 2 } },
      { "2026-08-10": 2 }
    );
    expect(grid[0].find((c) => c.day === "Mon")!.state).toBe("full");
  });

  it("marks a day 'partial' when 0 < done < expected", () => {
    const grid = buildCalendarGrid(
      ["2026-08-10"],
      { "2026-W33": { Mon: 3 } },
      { "2026-08-10": 1 }
    );
    expect(grid[0].find((c) => c.day === "Mon")!.state).toBe("partial");
  });

  it("marks a day 'empty' when no tasks are expected", () => {
    const grid = buildCalendarGrid(["2026-08-10"], {}, {});
    expect(grid[0].every((c) => c.state === "empty")).toBe(true);
  });

  it("marks a day 'empty' (not 'partial'/'full') when tasks exist but none done", () => {
    const grid = buildCalendarGrid(["2026-08-10"], { "2026-W33": { Tue: 2 } }, {});
    expect(grid[0].find((c) => c.day === "Tue")!.state).toBe("empty");
  });

  it("computes each cell's date correctly from its Monday", () => {
    const grid = buildCalendarGrid(["2026-08-10"], {}, {});
    expect(grid[0].map((c) => c.date)).toEqual([
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });
});

// W33: Mon=2026-08-10, Tue=08-11, Wed=08-12.
describe("currentStreak", () => {
  it("counts consecutive full days ending yesterday, skipping in-progress today", () => {
    const grid = buildCalendarGrid(
      ["2026-08-10"],
      { "2026-W33": { Mon: 1, Tue: 1, Wed: 1 } },
      { "2026-08-10": 1, "2026-08-11": 1 } // Mon, Tue done; Wed not
    );
    expect(currentStreak(grid, "2026-08-12")).toBe(2);
  });

  it("does not break the streak on a day with zero expected tasks", () => {
    const grid = buildCalendarGrid(
      ["2026-08-10"],
      { "2026-W33": { Mon: 1, Wed: 1 } }, // Tue has nothing scheduled
      { "2026-08-10": 1, "2026-08-12": 1 }
    );
    expect(currentStreak(grid, "2026-08-12")).toBe(2);
  });

  it("breaks the streak on a day with tasks that weren't all done", () => {
    const grid = buildCalendarGrid(
      ["2026-08-10"],
      { "2026-W33": { Mon: 1, Tue: 1, Wed: 1 } },
      { "2026-08-10": 0, "2026-08-11": 1, "2026-08-12": 1 } // Mon missed
    );
    expect(currentStreak(grid, "2026-08-12")).toBe(2);
  });

  it("is 0 when there is no history", () => {
    const grid = buildCalendarGrid(["2026-08-10"], {}, {});
    expect(currentStreak(grid, "2026-08-12")).toBe(0);
  });
});
