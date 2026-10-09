import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isISODate } from "@/lib/time";

// Side-job hours for one date. hours 0 clears it.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const hours = body?.hours;

  if (!isISODate(date) || typeof hours !== "number" || !(hours >= 0 && hours <= 24)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  if (hours === 0) {
    await prisma.workLog.deleteMany({ where: { userId, date } });
  } else {
    await prisma.workLog.upsert({
      where: { userId_date: { userId, date } },
      update: { hours },
      create: { userId, date, hours },
    });
  }

  return NextResponse.json({ ok: true, hours });
}
