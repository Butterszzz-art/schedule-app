import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const blockId = body?.blockId;
  const date = body?.date;
  const startMins = body?.startMins;

  if (
    typeof blockId !== "string" ||
    typeof date !== "string" ||
    typeof startMins !== "number" ||
    !Number.isFinite(startMins)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  const adjustment = await prisma.blockAdjustment.upsert({
    where: { userId_date_blockId: { userId, date, blockId } },
    update: { startMins },
    create: { userId, date, blockId, startMins },
  });

  return NextResponse.json({ ok: true, adjustment });
}
