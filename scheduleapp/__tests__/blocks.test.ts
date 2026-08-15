import { describe, expect, it } from "vitest";
import {
  SCHEDULE,
  dayKeyForDate,
  dayType,
  getBlocksForDate,
  getUniSessionsForDate,
} from "@/lib/schedule/blocks";
import type { DayKey, ScheduleMode, SemesterKey } from "@/lib/schedule/types";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SEMESTERS: SemesterKey[] = [1, 2];
const MODES: ScheduleMode[] = ["prep", "normal"];

describe("SCHEDULE", () => {
  it("has all 7 days for both semesters, in both modes", () => {
    for (const mode of MODES) {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          expect(SCHEDULE[mode][semester][day].length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never places cardio on Tue or Fri, in either mode", () => {
    for (const mode of MODES) {
      for (const semester of SEMESTERS) {
        for (const day of ["Tue", "Fri"] as DayKey[]) {
          const kinds = SCHEDULE[mode][semester][day].map((b) => b.kind);
          expect(kinds).not.toContain("cardio");
        }
      }
    }
  });

  it("keeps each day's blocks sorted by start time", () => {
    for (const mode of MODES) {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const starts = SCHEDULE[mode][semester][day].map((b) => b.start);
          const sorted = [...starts].sort((a, b) => a - b);
          expect(starts).toEqual(sorted);
        }
      }
    }
  });

  it("gives every block within a day a unique id", () => {
    for (const mode of MODES) {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const ids = SCHEDULE[mode][semester][day].map((b) => b.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });

  describe("prep mode", () => {
    it("places cardio on Mon, Thu, Sat, Wed, Sun -- 5 days", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const hasCardio = SCHEDULE.prep[semester][day].some(
            (b) => b.kind === "cardio"
          );
          expect(hasCardio).toBe(!["Tue", "Fri"].includes(day));
        }
      }
    });

    it("has no MA blocks anywhere", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const kinds = SCHEDULE.prep[semester][day].map((b) => b.kind);
          expect(kinds).not.toContain("ma");
        }
      }
    });

    it("has a posing block every day", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const kinds = SCHEDULE.prep[semester][day].map((b) => b.kind);
          expect(kinds).toContain("posing");
        }
      }
    });
  });

  describe("normal mode", () => {
    it("only places cardio on Mon, Thu, Sat", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const hasCardio = SCHEDULE.normal[semester][day].some(
            (b) => b.kind === "cardio"
          );
          expect(hasCardio).toBe(["Mon", "Thu", "Sat"].includes(day));
        }
      }
    });

    it("has MA only on Wed/Sun, no lifting those days", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const kinds = SCHEDULE.normal[semester][day].map((b) => b.kind);
          if (day === "Wed" || day === "Sun") {
            expect(kinds).toContain("ma");
            expect(kinds).not.toContain("gym");
          } else {
            expect(kinds).not.toContain("ma");
          }
        }
      }
    });

    it("has no posing blocks anywhere", () => {
      for (const semester of SEMESTERS) {
        for (const day of DAYS) {
          const kinds = SCHEDULE.normal[semester][day].map((b) => b.kind);
          expect(kinds).not.toContain("posing");
        }
      }
    });
  });
});

describe("dayType", () => {
  it("classifies upper/lower/rest by day of week, independent of mode", () => {
    expect(dayType("Mon")).toBe("upper");
    expect(dayType("Thu")).toBe("upper");
    expect(dayType("Sat")).toBe("upper");
    expect(dayType("Tue")).toBe("lower");
    expect(dayType("Fri")).toBe("lower");
    expect(dayType("Wed")).toBe("rest");
    expect(dayType("Sun")).toBe("rest");
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
    // 2026-09-03 is within the prep window (Aug 16 - Nov 2).
    const blocks = getBlocksForDate("2026-09-03", 1);
    const uniBlocks = blocks.filter((b) => b.kind === "uni");
    expect(uniBlocks).toHaveLength(2);

    const starts = blocks.map((b) => b.start);
    const sorted = [...starts].sort((a, b) => a - b);
    expect(starts).toEqual(sorted);
  });

  it("returns no uni blocks for a date outside the imported timetable", () => {
    // 2026-08-01 is before the prep window -> normal mode, and before the
    // timetable's earliest entry (2026-08-31) -> no uni sessions.
    const blocks = getBlocksForDate("2026-08-01", 1);
    expect(blocks.some((b) => b.kind === "uni")).toBe(false);
    // Still returns the fixed rhythm for that weekday (2026-08-01 = Sat).
    expect(blocks.some((b) => b.kind === "cardio")).toBe(true);
  });

  it("picks prep mode's rhythm on a date inside the prep window", () => {
    // 2026-09-01 (Tue) is within the prep window.
    const blocks = getBlocksForDate("2026-09-01", 1);
    expect(blocks.some((b) => b.kind === "posing")).toBe(true);
    expect(blocks.some((b) => b.kind === "ma")).toBe(false);
  });

  it("picks normal mode's rhythm on a date outside the prep window", () => {
    // 2026-12-02 (Wed) is after the prep window ends (Nov 2).
    const blocks = getBlocksForDate("2026-12-02", 1);
    expect(blocks.some((b) => b.kind === "posing")).toBe(false);
    expect(blocks.some((b) => b.kind === "ma")).toBe(true);
  });
});
