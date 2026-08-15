import { describe, expect, it } from "vitest";
import { shouldShowInstallBanner } from "@/lib/installBanner";

const IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IOS_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Mobile Safari/537.36";
const DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("shouldShowInstallBanner", () => {
  it("shows for iOS Safari when not already installed", () => {
    expect(shouldShowInstallBanner(IOS_SAFARI, false)).toBe(true);
  });

  it("never shows once running standalone", () => {
    expect(shouldShowInstallBanner(IOS_SAFARI, true)).toBe(false);
  });

  it("does not show for Chrome on iOS (Safari-based but can't install PWAs)", () => {
    expect(shouldShowInstallBanner(IOS_CHROME, false)).toBe(false);
  });

  it("does not show for Android or desktop", () => {
    expect(shouldShowInstallBanner(ANDROID_CHROME, false)).toBe(false);
    expect(shouldShowInstallBanner(DESKTOP_SAFARI, false)).toBe(false);
  });
});
