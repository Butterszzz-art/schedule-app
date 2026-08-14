import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DAY_KEYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const weekKey = body?.weekKey;
  const dayKey = body?.dayKey;
  const blockId = body?.blockId;
  const disabled = body?.disabled;

  if (
    typeof weekKey !== "string" ||
    typeof dayKey !== "string" ||
    !DAY_KEYS.has(dayKey) ||
    typeof blockId !== "string" ||
    typeof disabled !== "boolean"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  if (!disabled) {
    // Re-enabling: no override row means "active", so just remove it.
    await prisma.weekOverride.deleteMany({
      where: { userId, weekKey, dayKey, blockId },
    });
    return NextResponse.json({ ok: true, disabled: false });
  }

  const override = await prisma.weekOverride.upsert({
    where: {
      userId_weekKey_dayKey_blockId: { userId, weekKey, dayKey, blockId },
    },
    update: { disabled: true },
    create: { userId, weekKey, dayKey, blockId, disabled: true },
  });

  return NextResponse.json({ ok: true, override });
}
