"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/tasks", label: "Today" },
  { href: "/tasks/plan", label: "Plan" },
  { href: "/tasks/streaks", label: "Streaks" },
] as const;

export function TasksSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-4 flex gap-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-card-border text-foreground/50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
