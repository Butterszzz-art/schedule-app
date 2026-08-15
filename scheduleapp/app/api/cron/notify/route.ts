import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { isInNotifyWindow, notificationBody } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";
import { getBlocksForDate } from "@/lib/schedule/blocks";
import type { SemesterKey } from "@/lib/schedule/types";
import { minutesSinceMidnight, todayISODate } from "@/lib/time";

// An external scheduler (e.g. cron-job.org) hits this every minute --
// see README.md's Deploying section for why this isn't a Vercel Cron
// job. For every user, finds blocks whose notification window we're
// currently inside and sends a push -- unless we already have a
// NotifiedBlock row for that exact (user, date, block), which the
// unique constraint enforces so concurrent/duplicate ticks can't
// double-send.
async function handle(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayISODate();
  const nowMinutes = minutesSinceMidnight();

  const users = await prisma.user.findMany({ include: { settings: true } });

  let sent = 0;
  for (const user of users) {
    const semester = (user.settings?.semester ?? 1) as SemesterKey;
    const blocks = getBlocksForDate(date, semester);

    for (const block of blocks) {
      if (!isInNotifyWindow(block, nowMinutes)) continue;

      try {
        await prisma.notifiedBlock.create({
          data: { userId: user.id, date, blockId: block.id },
        });
      } catch {
        continue; // already notified for this block today
      }

      await sendPushToUser(user.id, {
        title: block.label,
        body: notificationBody(block),
        url: "/today",
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
