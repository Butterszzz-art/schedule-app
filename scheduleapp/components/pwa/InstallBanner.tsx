"use client";

import { useState, useSyncExternalStore } from "react";
import { shouldShowInstallBanner } from "@/lib/installBanner";

const DISMISS_KEY = "install-banner-dismissed";

// No ongoing subscription needed -- this is a one-time capability read,
// not a value that changes while mounted.
function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  if (localStorage.getItem(DISMISS_KEY)) return false;
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  return shouldShowInstallBanner(navigator.userAgent, isStandalone);
}

function getServerSnapshot(): boolean {
  return false;
}

export function InstallBanner() {
  // useSyncExternalStore (not useEffect+setState) so the server/first-
  // paint render and the real client value never disagree in a way that
  // trips a hydration mismatch -- it's built exactly for "read browser-
  // only state safely" cases like this.
  const detected = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!detected || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
      <span className="text-lg leading-none">📲</span>
      <div className="min-w-0 flex-1 text-xs text-foreground/80">
        <p className="font-medium">Install this app</p>
        <p className="mt-0.5 text-foreground/60">
          Tap the Share icon, then &ldquo;Add to Home Screen&rdquo; — needed for
          reminders to work on iPhone.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-foreground/40"
      >
        ✕
      </button>
    </div>
  );
}
