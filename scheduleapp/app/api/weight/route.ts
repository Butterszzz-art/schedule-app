import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const weight = body?.weight;

  if (
    typeof date !== "string" ||
    typeof weight !== "number" ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    weight > 400
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  const entry = await prisma.weightEntry.upsert({
    where: { userId_date: { userId, date } },
    update: { weight },
    create: { userId, date, weight },
  });

  return NextResponse.json({ ok: true, entry });
}
