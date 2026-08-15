import { describe, expect, it } from "vitest";
import { getScheduleMode, isPrep, PREP_END, PREP_START } from "@/lib/schedule/mode";

describe("getScheduleMode", () => {
  it("is 'prep' on the start boundary date, inclusive", () => {
    expect(getScheduleMode(PREP_START)).toBe("prep");
  });

  it("is 'prep' on the end boundary date, inclusive", () => {
    expect(getScheduleMode(PREP_END)).toBe("prep");
  });

  it("is 'prep' for dates well within the window", () => {
    expect(getScheduleMode("2026-09-01")).toBe("prep");
    expect(getScheduleMode("2026-10-17")).toBe("prep"); // Show 1
  });

  it("is 'normal' the day before the window starts", () => {
    expect(getScheduleMode("2026-08-15")).toBe("normal");
  });

  it("is 'normal' the day after the window ends", () => {
    expect(getScheduleMode("2026-11-03")).toBe("normal");
  });

  it("is 'normal' well outside the window on either side", () => {
    expect(getScheduleMode("2026-01-01")).toBe("normal");
    expect(getScheduleMode("2027-01-29")).toBe("normal");
  });
});

describe("isPrep", () => {
  it("matches getScheduleMode", () => {
    expect(isPrep("2026-09-01")).toBe(true);
    expect(isPrep("2026-12-01")).toBe(false);
  });
});
