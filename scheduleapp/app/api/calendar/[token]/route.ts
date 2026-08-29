import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateICS } from "@/lib/calendar/generate";
import type { SemesterKey } from "@/lib/schedule/types";

// Public feed: no session required -- the token in the URL is the auth.
// Apple Calendar polls this on its own refresh interval and re-derives
// the whole calendar from live DB state every time, so semester changes,
// week overrides, and the prep/normal mode boundary all show up on the
// next sync with no export step.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await params;
  // The dynamic segment captures the whole "<token>.ics" filename.
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;

  const settings = await prisma.userSettings.findUnique({
    where: { calendarToken: token },
  });

  if (!settings) {
    return new NextResponse("Not found", { status: 404 });
  }

  const weekOverrides = await prisma.weekOverride.findMany({
    where: { userId: settings.userId, disabled: true },
    select: { weekKey: true, dayKey: true, blockId: true },
  });

  const ics = generateICS({
    sem: settings.semester as SemesterKey,
    weekOverrides,
    userId: settings.userId,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="schedule.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
