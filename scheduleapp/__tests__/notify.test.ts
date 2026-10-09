import { describe, expect, it } from "vitest";
import { isNudgeTime, nudgeBody } from "@/lib/notify";

describe("isNudgeTime", () => {
  it("fires at 20:30", () => {
    expect(isNudgeTime(20 * 60 + 30)).toBe(true);
  });

  it("stays open for the 2-minute window", () => {
    expect(isNudgeTime(20 * 60 + 31.5)).toBe(true);
    expect(isNudgeTime(20 * 60 + 32)).toBe(false);
  });

  it("does not fire earlier in the evening", () => {
    expect(isNudgeTime(20 * 60 + 29)).toBe(false);
  });
});

describe("nudgeBody", () => {
  it("is null when everything is done", () => {
    expect(nudgeBody(0)).toBeNull();
  });

  it("uses the singular for one item", () => {
    expect(nudgeBody(1)).toBe("1 thing left on today's list");
  });

  it("counts several items", () => {
    expect(nudgeBody(4)).toBe("4 things left on today's list");
  });
});
