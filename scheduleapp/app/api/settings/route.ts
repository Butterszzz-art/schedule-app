import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setReminderTime } from "@/lib/settings";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reminderTime = body?.reminderTime;
  if (typeof reminderTime !== "string" || !TIME_RE.test(reminderTime)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await setReminderTime(session.user.id, reminderTime);
  return NextResponse.json({ ok: true, reminderTime });
}
