"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/habits", label: "Habits" },
  { href: "/log", label: "Log" },
  { href: "/prep", label: "Prep" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex justify-around border-t border-card-border bg-background/80 py-2 backdrop-blur-md">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              active ? "text-accent" : "text-foreground/50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
