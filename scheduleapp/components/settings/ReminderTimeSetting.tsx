"use client";

import { useState } from "react";

export function ReminderTimeSetting({ initialTime }: { initialTime: string }) {
  const [time, setTime] = useState(initialTime);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");

  const save = async (value: string) => {
    setTime(value);
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderTime: value }),
    }).catch(() => null);
    setStatus(res?.ok ? "saved" : "error");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="reminder-time" className="text-xs text-foreground/60">
        Evening reminder
      </label>
      <div className="flex items-center gap-2.5">
        <input
          id="reminder-time"
          type="time"
          value={time}
          onChange={(e) => save(e.target.value)}
          className="min-h-[46px] rounded-xl border border-card-border bg-[#141414] px-4 text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-foreground/40">
          {status === "saving" ? "Saving…" : status === "error" ? "Couldn't save" : "Saved"}
        </span>
      </div>
      <p className="text-sm text-foreground/50">
        One push at this time if anything on today&apos;s list is still open.
      </p>
    </div>
  );
}
