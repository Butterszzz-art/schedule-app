import { NextResponse } from "next/server";
import { dayScore, extrasForDate } from "@/lib/checklist/progress";
import { loadWeek } from "@/lib/checklist/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { isNudgeTime, nudgeBody, NUDGE_ID } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";
import { minutesSinceMidnight, startOfIsoWeek, todayISODate } from "@/lib/time";

// An external scheduler (e.g. cron-job.org) hits this every minute --
// see README.md's Deploying section for why this isn't a Vercel Cron
// job. Once a day, in the 20:30 window, it pushes an evening nudge with
// how many checklist items are still open -- unless we already have a
// NotifiedBlock row for (user, date, "evening-nudge"), which the unique
// constraint enforces so concurrent/duplicate ticks can't double-send.
async function handle(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNudgeTime(minutesSinceMidnight())) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const date = todayISODate();
  const users = await prisma.user.findMany({ select: { id: true } });

  let sent = 0;
  for (const user of users) {
    const week = await loadWeek(user.id, startOfIsoWeek(date));
    const { done, total } = dayScore(
      week.itemsByDate[date],
      week.valuesByDate[date],
      extrasForDate(week.extras, date, date)
    );
    const body = nudgeBody(total - done);
    if (!body) continue;

    try {
      await prisma.notifiedBlock.create({
        data: { userId: user.id, date, blockId: NUDGE_ID },
      });
    } catch {
      continue; // already nudged today
    }

    await sendPushToUser(user.id, { title: "Today", body, url: "/today" });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
