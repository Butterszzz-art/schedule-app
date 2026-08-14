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
  const status = body?.status;

  if (
    typeof blockId !== "string" ||
    typeof date !== "string" ||
    !(status === "done" || status === "skipped" || status === null)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  if (status === null) {
    await prisma.dayLog.deleteMany({ where: { userId, date, blockId } });
    return NextResponse.json({ ok: true, status: null });
  }

  const log = await prisma.dayLog.upsert({
    where: { userId_date_blockId: { userId, date, blockId } },
    update: { status },
    create: { userId, date, blockId, status },
  });

  return NextResponse.json({ ok: true, log });
}
