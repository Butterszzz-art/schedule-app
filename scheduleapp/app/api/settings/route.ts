import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const semester = body?.semester;

  if (semester !== 1 && semester !== 2) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: { semester },
    create: { userId, semester },
  });

  return NextResponse.json({ ok: true, settings });
}
