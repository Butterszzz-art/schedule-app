import Link from "next/link";
import { nextShow, daysUntil } from "@/lib/prep";

export function PrepModeBanner({ today }: { today: string }) {
  const show = nextShow(today);
  const days = daysUntil(show.date, today);
  const shortName = show.name.split(" — ")[0]; // "Show 1 — NPC Spain Naturals" -> "Show 1"

  return (
    <Link
      href="/prep"
      className="flex items-center justify-between rounded-lg border border-[#E0900033] bg-[#1A1000] px-3 py-2"
    >
      <span className="text-[11px] font-bold text-[#E09000]">
        🏆 PREP MODE — MA suspended · Posing daily
      </span>
      <span className="shrink-0 text-[11px] text-[#E09000]">
        {shortName} in {days}d
      </span>
    </Link>
  );
}
