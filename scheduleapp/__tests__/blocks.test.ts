import { describe, expect, it } from "vitest";
import {
  SCHEDULE,
  dayKeyForDate,
  getBlocksForDate,
  getUniSessionsForDate,
} from "@/lib/schedule/blocks";
import type { DayKey, SemesterKey } from "@/lib/schedule/types";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SEMESTERS: SemesterKey[] = [1, 2];

describe("SCHEDULE", () => {
  it("has all 7 days for both semesters", () => {
    for (const semester of SEMESTERS) {
      for (const day of DAYS) {
        expect(SCHEDULE[semester][day].length).toBeGreaterThan(0);
      }
    }
  });

  it("never places cardio on Tue or Fri", () => {
    for (const semester of SEMESTERS) {
      for (const day of ["Tue", "Fri"] as DayKey[]) {
        const kinds = SCHEDULE[semester][day].map((b) => b.kind);
        expect(kinds).not.toContain("cardio");
      }
    }
  });

  it("only places cardio on Mon, Thu, Sat", () => {
    for (const semester of SEMESTERS) {
      for (const day of DAYS) {
        const hasCardio = SCHEDULE[semester][day].some(
          (b) => b.kind === "cardio"
        );
        expect(hasCardio).toBe(["Mon", "Thu", "Sat"].includes(day));
      }
    }
  });

  it("has no lifting or cardio on Wed/Sun (MA only)", () => {
    for (const semester of SEMESTERS) {
      for (const day of ["Wed", "Sun"] as DayKey[]) {
        const kinds = SCHEDULE[semester][day].map((b) => b.kind);
        expect(kinds).not.toContain("gym");
        expect(kinds).not.toContain("cardio");
        expect(kinds).toContain("ma");
      }
    }
  });

  it("keeps each day's blocks sorted by start time", () => {
    for (const semester of SEMESTERS) {
      for (const day of DAYS) {
        const starts = SCHEDULE[semester][day].map((b) => b.start);
        const sorted = [...starts].sort((a, b) => a - b);
        expect(starts).toEqual(sorted);
      }
    }
  });
});

describe("dayKeyForDate", () => {
  it("maps known dates to the correct weekday", () => {
    expect(dayKeyForDate("2026-08-31")).toBe("Mon");
    expect(dayKeyForDate("2026-09-02")).toBe("Wed");
    expect(dayKeyForDate("2027-01-29")).toBe("Fri");
  });
});

describe("getUniSessionsForDate / getBlocksForDate", () => {
  it("finds the two real sessions on 2026-09-03 from the imported timetable", () => {
    const sessions = getUniSessionsForDate("2026-09-03");
    expect(sessions).toHaveLength(2);
    expect(sessions[0].start).toBeLessThan(sessions[1].start);
  });

  it("merges real uni sessions into that date's rhythm, time-sorted", () => {
    const blocks = getBlocksForDate("2026-09-03", 1);
    const uniBlocks = blocks.filter((b) => b.kind === "uni");
    expect(uniBlocks).toHaveLength(2);

    const starts = blocks.map((b) => b.start);
    const sorted = [...starts].sort((a, b) => a - b);
    expect(starts).toEqual(sorted);
  });

  it("returns no uni blocks for a date outside the imported timetable", () => {
    const blocks = getBlocksForDate("2026-08-01", 1);
    expect(blocks.some((b) => b.kind === "uni")).toBe(false);
    // Still returns the fixed rhythm for that weekday (2026-08-01 = Sat).
    expect(blocks.some((b) => b.kind === "cardio")).toBe(true);
  });
});
