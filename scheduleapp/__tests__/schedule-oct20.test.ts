import { describe, expect, it } from "vitest";
import { availabilityForDate, lateThenEarlyClashes } from "@/lib/checklist/availability";
import { applyDayPlan, dayPlan } from "@/lib/checklist/dayplan";
import { DEFAULT_ROUTINE } from "@/lib/checklist/defaults";
import { attendsSession, itemsForDate, uniItemsForDate, upcomingAssessments } from "@/lib/checklist/logic";
import { studyPlanItemsForDate } from "@/lib/checklist/studyplan";
import type { RoutineItemDTO } from "@/lib/checklist/types";
import { UNI_SESSIONS } from "@/lib/schedule/uni";

const shift = (date: string, start: string) => ({ date, start });

describe("dayPlan", () => {
  it("normal day: 05:45 / 21:45, gym 06:00, standard meal times", () => {
    const p = dayPlan("2026-11-09", []);
    expect(p).toMatchObject({ wake: "05:45", bed: "21:45", gym: "06:00" });
    expect(p.meals).toBe("M1 by 06:45 · M2 12:00 · M3 15:00 · M4 18:30 · snack 22:30");
  });

  it("16-19 shift: packed M3 at 14:45, M4 19:30 after work", () => {
    expect(dayPlan("2026-11-09", [shift("2026-11-09", "16:00")]).meals).toBe(
      "M1 by 06:45 · M2 12:00 · M3 14:45 (packed) · M4 19:30 after work · snack 22:30"
    );
  });

  it("19-22:30 shift: bed 23:00, wake 07:00, gym after 08:00, M4 before work, skyr after", () => {
    const p = dayPlan("2026-11-13", [shift("2026-11-13", "19:00")]);
    expect(p).toMatchObject({ wake: "07:00", bed: "23:00", gym: "After 08:00" });
    expect(p.meals).toBe("M1 by 08:00 · M2 12:00 · M3 15:00 · M4 17:30–18:00 before work · skyr 22:45 after work");
  });

  it("the morning after a late shift still wakes at 07:00 (8 h sleep)", () => {
    const p = dayPlan("2026-11-14", [shift("2026-11-13", "19:00")]);
    expect(p).toMatchObject({ wake: "07:00", bed: "21:45", gym: "After 08:00" });
  });

  it("Saturday 07-10 shift: M1 ~06:15, M2 ~10:30, gym after the shift", () => {
    const p = dayPlan("2026-11-14", [shift("2026-11-14", "07:00")]);
    expect(p.gym).toBe("After the shift (~10:30)");
    expect(p.meals.startsWith("M1 ~06:15 · M2 ~10:30 after shift")).toBe(true);
  });

  it("only rewrites days from Oct 20 on", () => {
    const routine: RoutineItemDTO[] = DEFAULT_ROUTINE.prep.map((d, order) => ({ ...d, id: d.key, order }));
    const before = itemsForDate(routine, "2026-10-19", []);
    expect(applyDayPlan(before, "2026-10-19", [])).toBe(before);
    const after = applyDayPlan(itemsForDate(routine, "2026-10-20", []), "2026-10-20", []);
    expect(after.find((i) => i.key === "wake")?.label).toBe("Up by 05:45");
    expect(after.find((i) => i.key === "gym-lower")?.hint).toBe("06:00");
  });
});

describe("AH availability", () => {
  it("follows the normal week", () => {
    expect(availabilityForDate("2026-11-09")).toEqual({ kind: "slots", slots: [{ start: "16:00", end: "19:00" }] });
    const fri = availabilityForDate("2026-11-20");
    expect(fri.kind === "slots" && fri.slots.map((s) => s.start)).toEqual(["16:00", "19:00"]);
    const sat = availabilityForDate("2026-11-21");
    expect(sat.kind === "slots" && sat.slots.map((s) => s.start)).toEqual(["07:00", "16:00"]);
  });

  it("applies the exceptions", () => {
    expect(availabilityForDate("2026-10-19").kind).toBe("none");
    for (const d of ["2026-10-20", "2026-10-21", "2026-10-22", "2026-11-10", "2026-11-13", "2026-11-27", "2026-12-16"]) {
      const a = availabilityForDate(d);
      expect(a.kind === "slots" && a.slots).toEqual([]);
    }
    for (const d of ["2026-10-28", "2026-11-01", "2026-11-07"]) expect(availabilityForDate(d).kind).toBe("away");
    expect(availabilityForDate("2026-11-08")).toMatchObject({ kind: "slots", slots: [{ start: "16:00" }] });
  });

  it("flags a late Friday shift followed by a Saturday morning shift", () => {
    expect(lateThenEarlyClashes([shift("2026-11-20", "19:00"), shift("2026-11-21", "07:00")])).toEqual(["2026-11-20"]);
    expect(lateThenEarlyClashes([shift("2026-11-20", "16:00"), shift("2026-11-21", "07:00")])).toEqual([]);
    expect(lateThenEarlyClashes([shift("2026-11-20", "19:00"), shift("2026-11-21", "16:00")])).toEqual([]);
  });
});

describe("Review self-study plan", () => {
  const chunks = (d: string) => studyPlanItemsForDate(d)[0]?.chunks ?? [];
  it("is ~12 h/week Nov 9 - Dec 6, ~4 h/week to Dec 15, 50 h over Dec 17 - Jan 10", () => {
    expect(chunks("2026-11-08")).toEqual([]);
    expect(chunks("2026-11-09")).toEqual(["1h", "1h"]);
    expect(chunks("2026-11-15")).toEqual([]); // Sunday off
    expect(chunks("2026-12-07")).toEqual(["1h"]);
    expect(chunks("2026-12-09")).toEqual([]); // Wednesday off
    expect(chunks("2026-12-16")).toEqual([]); // exam day
    expect(chunks("2026-12-17")).toEqual(["1h", "1h"]);
    expect(chunks("2027-01-10")).toEqual(["1h", "1h"]);
    expect(chunks("2027-01-11")).toEqual([]);
  });
});

describe("timetable, Oct 20 update", () => {
  it("shows every Review Jaar 2 PB session, including the 09:00 lecture", () => {
    expect(attendsSession({ type: "Lecture", start: 9, courseCode: "5102MIEN6Y" })).toBe(true);
    expect(uniItemsForDate("2026-10-26").map((i) => i.label)).toContain("Lecture: Review Jaar 2 PB");
    expect(uniItemsForDate("2026-10-27")).toMatchObject([{ label: "Seminar: Review Jaar 2 PB", hint: "11:00–12:45 · SP G2.10" }]);
  });

  it("has no duplicate sessions and no honours courses", () => {
    const sig = UNI_SESSIONS.map((s) => `${s.date}|${s.start}|${s.courseCode}|${s.type}`);
    expect(new Set(sig).size).toBe(sig.length);
    expect(UNI_SESSIONS.some((s) => /honou?rs/i.test(s.courseName))).toBe(false);
  });

  it("marks the Nov 19 interim test optional and flags the Dec 16 back-to-back exams", () => {
    expect(upcomingAssessments("2026-11-19", 0)[0].note).toBe("Optional");
    expect(upcomingAssessments("2026-12-16", 0).map((a) => a.note.includes("no travel time"))).toEqual([true, true]);
  });
});

describe("PT routine items", () => {
  it("adds 2 check-ins (Mon, Thu) and 1 programming block (Sun) in both modes", () => {
    for (const mode of ["prep", "normal"] as const) {
      const r = DEFAULT_ROUTINE[mode];
      expect(r.find((i) => i.key === "pt-checkin")?.days).toEqual([0, 3]);
      expect(r.find((i) => i.key === "pt-programming")?.days).toEqual([6]);
    }
  });
});
