import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Invalidates the current subscribe URL and issues a new one. The old
// URL stops resolving immediately -- Apple Calendar needs to be
// re-subscribed with the new one (see Settings page).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { calendarToken: token },
    create: { userId: session.user.id, calendarToken: token },
  });

  return NextResponse.json({ ok: true, calendarToken: settings.calendarToken });
}
