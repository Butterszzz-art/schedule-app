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
    <nav
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 justify-around border-t border-[#161616] bg-background/80 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 flex-1 items-center justify-center text-xs font-semibold transition-colors ${
              active ? "text-accent" : "text-[#333]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
