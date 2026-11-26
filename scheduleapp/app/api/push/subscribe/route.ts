import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Registers either a Web Push subscription (browser/PWA) or, when
// { platform: "ios", deviceToken } is sent, an APNs device token from the
// native app (see components/pwa/NativePushRegister.tsx).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);

  if (body?.platform === "ios") {
    const deviceToken = body?.deviceToken;
    if (typeof deviceToken !== "string" || deviceToken.length === 0) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await prisma.pushSubscription.upsert({
      where: { deviceToken },
      update: { userId },
      create: { userId, platform: "ios", deviceToken },
    });
    return NextResponse.json({ ok: true });
  }

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof authKey !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth: authKey },
    create: { userId, platform: "web", endpoint, p256dh, auth: authKey },
  });

  return NextResponse.json({ ok: true });
}
