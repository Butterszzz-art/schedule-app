"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability/push just won't be available; nothing else
        // in the app depends on the service worker.
      });
    }
  }, []);

  return null;
}
