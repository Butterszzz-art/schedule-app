import { describe, expect, it } from "vitest";
import {
  currentWeightTarget,
  daysUntil,
  getCurrentPhase,
  nextShow,
  weeksOut,
  weightVariance,
} from "@/lib/prep";

describe("getCurrentPhase", () => {
  it("identifies each phase from a date within it", () => {
    expect(getCurrentPhase("2026-06-15")?.name).toBe("Base Cut");
    expect(getCurrentPhase("2026-08-15")?.name).toBe("Vacation"); // real dates: Aug 9-19
    expect(getCurrentPhase("2026-09-20")?.name).toBe("Final Push");
  });

  it("treats a phase boundary date as the start of the next phase", () => {
    expect(getCurrentPhase("2026-08-19")?.name).toBe("Real Prep");
  });

  // Base Cut ends Jul 25 and Real Prep still starts Aug 4 (the v4 PDF's
  // original, uncorrected dates) even though real Vacation is Aug 9-19 --
  // left as a known gap at the user's request (2026-08-17) pending real
  // Real Prep/Final Push boundaries, rather than guessing a compressed
  // schedule. Vacation still wins Aug 9-19 since it's checked first.
  it("has a known gap between Base Cut ending and Real Prep's stale start date", () => {
    expect(getCurrentPhase("2026-07-30")).toBeNull();
  });

  it("includes the show date itself in the last phase", () => {
    expect(getCurrentPhase("2026-10-17")?.name).toBe("Final Push");
  });

  it("returns null outside the whole prep range", () => {
    expect(getCurrentPhase("2026-05-01")).toBeNull();
    expect(getCurrentPhase("2026-11-01")).toBeNull();
  });
});

describe("nextShow", () => {
  it("returns Show 1 before it happens", () => {
    expect(nextShow("2026-08-15").name).toContain("Show 1");
  });

  it("returns Show 1 on its own date", () => {
    expect(nextShow("2026-10-17").name).toContain("Show 1");
  });

  it("returns Show 2 after Show 1 has passed", () => {
    expect(nextShow("2026-10-20").name).toContain("Show 2");
  });
});

describe("daysUntil / weeksOut", () => {
  it("computes days until a future date", () => {
    expect(daysUntil("2026-08-25", "2026-08-15")).toBe(10);
  });

  it("is negative for a past date", () => {
    expect(daysUntil("2026-08-10", "2026-08-15")).toBe(-5);
  });

  it("rounds weeksOut up (ceil) so a partial week still counts", () => {
    expect(weeksOut("2026-08-22", "2026-08-15")).toBe(1); // exactly 7 days
    expect(weeksOut("2026-08-23", "2026-08-15")).toBe(2); // 8 days -> ceil to 2
  });

  it("is 0 once the date has passed", () => {
    expect(weeksOut("2026-08-10", "2026-08-15")).toBe(0);
  });
});

describe("currentWeightTarget", () => {
  it("returns the nearest upcoming checkpoint", () => {
    expect(currentWeightTarget("2026-08-12").date).toBe("2026-08-18");
  });

  it("returns today's checkpoint when today is exactly a checkpoint date", () => {
    expect(currentWeightTarget("2026-08-18").date).toBe("2026-08-18");
  });

  it("falls back to the last checkpoint once prep is over", () => {
    expect(currentWeightTarget("2026-11-01").date).toBe("2026-10-17");
  });
});

describe("weightVariance", () => {
  it("is ahead (green) when at or below target", () => {
    const r = weightVariance(79.0, 79.2);
    expect(r.aheadOfSchedule).toBe(true);
    expect(r.diff).toBeCloseTo(-0.2);
  });

  it("is behind (red) when above target", () => {
    const r = weightVariance(80.0, 79.2);
    expect(r.aheadOfSchedule).toBe(false);
    expect(r.diff).toBeCloseTo(0.8);
  });
});
