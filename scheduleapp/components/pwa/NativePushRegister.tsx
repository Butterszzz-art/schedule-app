"use client";

import { useEffect } from "react";

/**
 * Registers for native push when running inside the Capacitor iOS shell
 * (no-op in a regular browser/PWA, which uses NotificationSetup's Web Push
 * flow instead). See lib/push.ts for the APNs-sending side -- untested
 * without real Apple Developer credentials, same as this registration
 * flow.
 */
export function NativePushRegister() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      let status = (await PushNotifications.checkPermissions()).receive;
      if (status === "prompt" || status === "prompt-with-rationale") {
        status = (await PushNotifications.requestPermissions()).receive;
      }
      if (status !== "granted" || cancelled) return;

      PushNotifications.addListener("registration", (token) => {
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "ios", deviceToken: token.value }),
        }).catch(() => {});
      });
      PushNotifications.addListener("registrationError", () => {
        // Nothing else in the app depends on native push registering.
      });

      await PushNotifications.register();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
