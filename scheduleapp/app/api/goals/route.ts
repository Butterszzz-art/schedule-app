import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ISO_WEEK = /^\d{4}-W\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// Adds a custom goal: scope "week" (period "2026-W45") or "month" (period "2026-11").
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const scope = body?.scope;
  const period = body?.period;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const target = Number.isInteger(body?.target) ? body.target : 1;

  if (
    !(scope === "week" || scope === "month") ||
    typeof period !== "string" ||
    !(scope === "week" ? ISO_WEEK : MONTH).test(period) ||
    title.length === 0 ||
    title.length > 200 ||
    target < 1 ||
    target > 100
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: { userId: session.user.id, scope, period, title, target },
  });

  return NextResponse.json(
    { id: goal.id, scope, period, title: goal.title, target: goal.target, progress: goal.progress },
    { status: 201 }
  );
}
