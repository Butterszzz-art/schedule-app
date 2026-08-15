import { describe, expect, it } from "vitest";
import { isInNotifyWindow, notificationBody } from "@/lib/notify";

describe("isInNotifyWindow", () => {
  it("fires for gym exactly 10 minutes before start", () => {
    const block = { kind: "gym" as const, start: 6 }; // 06:00
    expect(isInNotifyWindow(block, 5 * 60 + 50)).toBe(true); // 05:50
  });

  it("does not fire well before the window", () => {
    const block = { kind: "gym" as const, start: 6 };
    expect(isInNotifyWindow(block, 5 * 60 + 30)).toBe(false); // 05:30
  });

  it("does not fire after the window has closed", () => {
    const block = { kind: "gym" as const, start: 6 };
    expect(isInNotifyWindow(block, 6 * 60)).toBe(false); // 06:00, already started
  });

  it("uses a 5-minute lead for meals", () => {
    const block = { kind: "meal" as const, start: 13 }; // 13:00
    expect(isInNotifyWindow(block, 12 * 60 + 55)).toBe(true);
    expect(isInNotifyWindow(block, 12 * 60 + 40)).toBe(false);
  });

  it("uses a 15-minute lead for sleep", () => {
    const block = { kind: "sleep" as const, start: 21.75 }; // 21:45
    expect(isInNotifyWindow(block, 21 * 60 + 30)).toBe(true); // 21:30
  });

  it("never fires for kinds with no configured lead time", () => {
    const block = { kind: "free" as const, start: 20 };
    expect(isInNotifyWindow(block, 19 * 60 + 50)).toBe(false);
  });
});

describe("notificationBody", () => {
  it("includes the lead time and the block's time range", () => {
    const body = notificationBody({ kind: "gym", start: 6, dur: 90 });
    expect(body).toBe("Starts in 10 minutes · 06:00–07:30");
  });
});
