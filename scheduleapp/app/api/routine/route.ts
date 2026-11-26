import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Adds a custom item (plain checkbox, every day) to the user's routine.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const area = body?.area;
  const label = typeof body?.label === "string" ? body.label.trim() : "";

  if (typeof area !== "string" || label.length === 0 || label.length > 120) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;
  const areaRow = await prisma.userArea.findFirst({ where: { userId, key: area, archived: false } });
  if (!areaRow) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const last = await prisma.routineItem.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
  });

  const item = await prisma.routineItem.create({
    data: {
      userId,
      key: `custom-${crypto.randomUUID()}`,
      area,
      kind: areaRow.kind,
      label,
      days: [0, 1, 2, 3, 4, 5, 6],
      order: (last?.order ?? 0) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
