import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SKIPPED } from "@/lib/checklist/progress";
import { isISODate } from "@/lib/time";

// Sets progress on one checklist item for one date. value 0 clears it.
// value SKIPPED (-1) marks the item excused for the day instead.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const itemKey = body?.itemKey;
  const value = body?.value;

  if (
    !isISODate(date) ||
    typeof itemKey !== "string" ||
    itemKey.length === 0 ||
    itemKey.length > 200 ||
    !Number.isInteger(value) ||
    value < SKIPPED ||
    value > 1000
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  if (value === 0) {
    await prisma.checklistEntry.deleteMany({ where: { userId, date, itemKey } });
    return NextResponse.json({ ok: true, value: 0 });
  }

  await prisma.checklistEntry.upsert({
    where: { userId_date_itemKey: { userId, date, itemKey } },
    update: { value },
    create: { userId, date, itemKey, value },
  });

  return NextResponse.json({ ok: true, value });
}
