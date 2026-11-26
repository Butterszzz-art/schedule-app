import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createArea } from "@/lib/checklist/areas";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { BlockKind } from "@/lib/schedule/types";

const VALID_KINDS = new Set(Object.keys(BLOCK_COLORS));

function isBlockKind(value: unknown): value is BlockKind {
  return typeof value === "string" && VALID_KINDS.has(value);
}

// Creates a user-defined checklist area (onboarding, or the Routine tab).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const kind = body?.kind;

  if (label.length === 0 || label.length > 60 || !isBlockKind(kind)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const area = await createArea(session.user.id, label, kind);
  return NextResponse.json(area, { status: 201 });
}
