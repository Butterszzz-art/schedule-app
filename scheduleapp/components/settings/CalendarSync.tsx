"use client";

import { useState } from "react";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-xs text-foreground/60">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#141414] text-[10px] font-semibold text-foreground/50">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

export function CalendarSync({
  initialToken,
  baseUrl,
}: {
  initialToken: string;
  baseUrl: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `${baseUrl}/api/calendar/${token}.ics`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select and copy the URL manually.");
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/regenerate", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.calendarToken);
      setConfirming(false);
    } catch {
      setError("Couldn't regenerate the token — try again.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-[#0E0E0E] p-4">
      <div>
        <h2 className="text-sm font-semibold">Calendar sync</h2>
        <p className="mt-1 text-xs text-foreground/40">
          Subscribe Apple Calendar to this URL — it auto-refreshes and
          always reflects the live schedule (prep mode, semester, week
          overrides).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="overflow-x-auto rounded-lg border border-card-border bg-[#141414] px-3 py-2.5">
          <code className="whitespace-nowrap text-xs text-foreground/70">{url}</code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-11 rounded-lg border border-card-border text-xs font-semibold text-foreground transition-colors active:bg-[#141414]"
        >
          {copied ? "Copied ✓" : "Copy URL"}
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-card-border pt-3">
        <span className="text-xs font-semibold text-foreground/60">
          How to subscribe
        </span>
        <ol className="flex flex-col gap-1.5">
          <Step n={1}>
            <strong className="text-foreground/80">iPhone:</strong> Settings →
            Calendar → Accounts → Add Account → Other → Add Subscribed
            Calendar
          </Step>
          <Step n={2}>Paste the URL above → Next → Save</Step>
          <Step n={3}>Set refresh interval to every 5 minutes</Step>
          <Step n={4}>
            <strong className="text-foreground/80">Mac:</strong> Calendar app
            → File → New Calendar Subscription → paste URL → Subscribe
          </Step>
        </ol>
        <p className="text-[11px] text-foreground/40">
          Subscribing once on iPhone syncs to every Apple device on the same
          iCloud account.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-card-border pt-3">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 rounded-lg text-xs font-semibold text-foreground/40"
          >
            Regenerate token
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-[#F8717133] bg-[#1A0A08] p-3">
            <p className="text-[11px] text-[#F87171]">
              This invalidates the current URL — Apple Calendar will need to
              be re-subscribed with the new one.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="min-h-11 flex-1 rounded-lg bg-[#F87171] text-xs font-semibold text-[#0A0A0A] disabled:opacity-50"
              >
                {regenerating ? "Regenerating…" : "Confirm regenerate"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-11 flex-1 rounded-lg border border-card-border text-xs font-semibold text-foreground/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-[11px] text-[#F87171]">{error}</p>}
      </div>
    </div>
  );
}
