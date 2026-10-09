import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EDITABLE_AREAS } from "@/lib/checklist/areas";

const AREA_KIND = Object.fromEntries(EDITABLE_AREAS.map((a) => [a.key, a.kind]));

// Adds a custom item (plain checkbox, every day) to a mode's routine.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  const area = body?.area;
  const label = typeof body?.label === "string" ? body.label.trim() : "";

  if (
    !(mode === "prep" || mode === "normal") ||
    typeof area !== "string" ||
    !(area in AREA_KIND) ||
    label.length === 0 ||
    label.length > 120
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;
  const last = await prisma.routineItem.findFirst({
    where: { userId, mode },
    orderBy: { order: "desc" },
  });

  const item = await prisma.routineItem.create({
    data: {
      userId,
      mode,
      key: `custom-${crypto.randomUUID()}`,
      area,
      kind: AREA_KIND[area],
      label,
      days: [0, 1, 2, 3, 4, 5, 6],
      order: (last?.order ?? 0) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
