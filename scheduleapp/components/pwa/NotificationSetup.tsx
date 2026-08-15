"use client";

import { useState, useSyncExternalStore } from "react";

type PassiveStatus = "unsupported" | "denied" | "ready";
type ActiveStatus = "idle" | "subscribing" | "subscribed";

function subscribe() {
  return () => {};
}

function getSnapshot(): PassiveStatus {
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "ready";
}

function getServerSnapshot(): PassiveStatus {
  return "ready"; // corrected on the client immediately, before paint settles
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export function NotificationSetup() {
  // Ambient browser capability/permission (read via useSyncExternalStore,
  // not useEffect+setState, so server/first-paint and the real client
  // value never disagree in a way that trips a hydration mismatch).
  const passive = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // User-driven state from actually clicking "Enable" -- a normal event
  // handler, not an effect, so it's unaffected by that concern.
  const [active, setActive] = useState<ActiveStatus>("idle");

  const enable = async () => {
    setActive("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setActive("idle");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Missing VAPID public key");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Subscribe request failed");

      setActive("subscribed");
    } catch {
      setActive("idle");
    }
  };

  if (passive === "unsupported") return null;

  const denied = active === "idle" && passive === "denied";
  const subscribed = active === "subscribed";
  const subscribing = active === "subscribing";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-[#0E0E0E] p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Block reminders</p>
        <p className="text-xs text-foreground/50">
          {denied
            ? "Blocked — enable notifications for this app in your browser/OS settings."
            : subscribed
              ? "You'll get a push before each block starts."
              : "Get notified before gym, cardio, meals, and more."}
        </p>
      </div>
      {!subscribed && !denied && (
        <button
          type="button"
          onClick={enable}
          disabled={subscribing}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#0A0A0A] disabled:opacity-50"
        >
          Enable
        </button>
      )}
    </div>
  );
}
