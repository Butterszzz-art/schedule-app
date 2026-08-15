import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { sendPushToUser } from "@/lib/push";

// Internal endpoint -- not user-facing. Sends a push to one user's
// subscriptions. Called by /api/cron/notify today; kept as its own route
// (rather than inlined) so other future triggers can reuse it.
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  const title = body?.title;
  const bodyText = body?.body;
  const url = body?.url;

  if (
    typeof userId !== "string" ||
    typeof title !== "string" ||
    typeof bodyText !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await sendPushToUser(userId, {
    title,
    body: bodyText,
    url: typeof url === "string" ? url : undefined,
  });

  return NextResponse.json({ ok: true });
}
