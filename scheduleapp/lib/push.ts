import webpush from "web-push";
import { prisma } from "./db";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends `payload` to every push subscription this user has registered. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // A 404/410 means the browser/OS discarded the subscription -- clean it up
  // so future sends don't keep retrying a dead endpoint.
  await Promise.all(
    results.map((result, i) => {
      if (result.status !== "rejected") return Promise.resolve();
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode !== 404 && statusCode !== 410) return Promise.resolve();
      return prisma.pushSubscription
        .delete({ where: { id: subs[i].id } })
        .catch(() => {});
    })
  );

  return results;
}
