import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { archiveArea, updateArea } from "@/lib/checklist/areas";
import { BLOCK_COLORS } from "@/lib/schedule/colors";
import type { BlockKind } from "@/lib/schedule/types";

const VALID_KINDS = new Set(Object.keys(BLOCK_COLORS));

function isBlockKind(value: unknown): value is BlockKind {
  return typeof value === "string" && VALID_KINDS.has(value);
}

// { label?, kind?, order? } -- rename, recolour, or reorder an area.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const patch: { label?: string; kind?: BlockKind; order?: number } = {};

  if (body?.label !== undefined) {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (label.length === 0 || label.length > 60) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    patch.label = label;
  }
  if (body?.kind !== undefined) {
    if (!isBlockKind(body.kind)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    patch.kind = body.kind;
  }
  if (body?.order !== undefined) {
    if (!Number.isInteger(body.order)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    patch.order = body.order;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const area = await updateArea(session.user.id, id, patch);
  if (!area) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(area);
}

// Archives rather than deletes, so any RoutineItem still in this area
// keeps a label to belong to instead of being orphaned.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const ok = await archiveArea(session.user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ archived: true });
}
