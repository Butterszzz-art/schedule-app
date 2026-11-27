import type { CapacitorConfig } from "@capacitor/cli";

// "Remote" mode: the native shell just loads the deployed Next.js app in a
// WKWebView (see README.md's Deploying section / the Phase 5 notes) rather
// than bundling a static export -- this app relies on server components and
// server actions, which only run against the real backend.
//
const config: CapacitorConfig = {
  appId: "com.scheduling.productivity",
  appName: "Schedule",
  webDir: "public", // unused in remote mode, but required by the CLI
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? "https://schedule-app-six-sable.vercel.app",
    cleartext: false,
  },
};

export default config;
