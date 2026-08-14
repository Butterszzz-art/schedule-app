import { describe, expect, it } from "vitest";
import { calcStreaks, heatmapForCategory, weeklyScore, HABIT_CATEGORIES } from "@/lib/habits";
import type { LogsByDate } from "@/lib/habits";

// 2026-08-15 = Sat (Upper), 2026-08-16 = Sun (rest, MA only, no gym),
// 2026-08-17 = Mon (Upper), 2026-08-18 = Tue (Lower).
const GYM_CAT = HABIT_CATEGORIES.find((c) => c.key === "gym")!;

describe("calcStreaks", () => {
  it("does not break the gym streak on a rest day (Sun)", () => {
    const logs: LogsByDate = {
      "2026-08-15": { "s1-sat-gym": "done" },
      "2026-08-17": { "s1-mon-gym": "done" },
    };
    const result = calcStreaks(logs, 1, "2026-08-17");
    expect(result.gym.streak).toBe(2);
    expect(result.gym.best).toBe(2);
    expect(result.gym.total).toBe(2);
  });

  it("breaks the streak on an expected day with no done log", () => {
    const logs: LogsByDate = {
      "2026-08-15": { "s1-sat-gym": "done" },
      // 2026-08-17 (Mon) expected but not logged at all -> breaks
      "2026-08-18": { "s1-tue-gym": "done" },
    };
    const result = calcStreaks(logs, 1, "2026-08-18");
    expect(result.gym.streak).toBe(1); // just today (Tue)
    expect(result.gym.best).toBe(1); // the earlier Sat=1 run
    expect(result.gym.total).toBe(2);
  });

  it("does not prematurely break the streak on today's still-in-progress day", () => {
    const logs: LogsByDate = {
      "2026-08-15": { "s1-sat-gym": "done" },
      // 2026-08-16 Sun is rest, skipped
      // 2026-08-17 Mon is "today" -- not logged yet, day still in progress
    };
    const result = calcStreaks(logs, 1, "2026-08-17");
    expect(result.gym.streak).toBe(1);
    expect(result.gym.best).toBe(1);
    expect(result.gym.total).toBe(1);
  });

  it("counts a skipped (not done) block as breaking the streak", () => {
    const logs: LogsByDate = {
      "2026-08-15": { "s1-sat-gym": "done" },
      "2026-08-17": { "s1-mon-gym": "skipped" },
      "2026-08-18": { "s1-tue-gym": "done" },
    };
    const result = calcStreaks(logs, 1, "2026-08-18");
    expect(result.gym.streak).toBe(1);
  });

  it("returns all-zero results when there are no logs", () => {
    const result = calcStreaks({}, 1, "2026-08-17");
    for (const cat of HABIT_CATEGORIES) {
      expect(result[cat.key]).toEqual({ streak: 0, best: 0, total: 0 });
    }
  });
});

describe("heatmapForCategory", () => {
  it("marks a rest day as 'none' (not expected) for the gym category", () => {
    const cells = heatmapForCategory({}, 1, GYM_CAT, "2026-08-16");
    const sunday = cells.find((c) => c.date === "2026-08-16")!;
    expect(sunday.state).toBe("none");
    expect(sunday.isToday).toBe(true);
  });

  it("marks an expected day with no logs as 'missed'", () => {
    const cells = heatmapForCategory({}, 1, GYM_CAT, "2026-08-15");
    const saturday = cells.find((c) => c.date === "2026-08-15")!;
    expect(saturday.state).toBe("missed");
  });

  it("marks a fully-done day as 'full'", () => {
    const logs: LogsByDate = { "2026-08-15": { "s1-sat-gym": "done" } };
    const cells = heatmapForCategory(logs, 1, GYM_CAT, "2026-08-15");
    const saturday = cells.find((c) => c.date === "2026-08-15")!;
    expect(saturday.state).toBe("full");
  });

  it("returns exactly 7 days ending on `today`", () => {
    const cells = heatmapForCategory({}, 1, GYM_CAT, "2026-08-17");
    expect(cells).toHaveLength(7);
    expect(cells[6].date).toBe("2026-08-17");
    expect(cells[0].date).toBe("2026-08-11");
  });
});

describe("weeklyScore", () => {
  it("is 0 with no logs", () => {
    expect(weeklyScore({}, 1, "2026-08-10", "2026-08-15")).toBe(0);
  });

  it("increases as more expected blocks are marked done", () => {
    const logs: LogsByDate = { "2026-08-15": { "s1-sat-gym": "done" } };
    const score = weeklyScore(logs, 1, "2026-08-10", "2026-08-15");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
