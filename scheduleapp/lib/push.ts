import { createSign } from "crypto";
import http2 from "http2";
import webpush from "web-push";
import { prisma } from "./db";

let webPushConfigured = false;
function ensureWebPushConfigured() {
  if (webPushConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  webPushConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// ── APNs (native iOS push) ───────────────────────────────────────────────
// Written to Apple's documented token-based provider API using only Node's
// built-in crypto/http2 (no extra dependency) -- but genuinely UNTESTED:
// doing so needs a real Apple Developer APNs Auth Key, which doesn't exist
// yet. Set APNS_KEY_ID / APNS_TEAM_ID / APNS_PRIVATE_KEY (the .p8 key's
// contents) / APNS_BUNDLE_ID (must match capacitor.config.ts's appId) once
// you have one, from Apple Developer -> Certificates, IDs & Profiles ->
// Keys -> a key with the "Apple Push Notifications service" capability.
// Test carefully against APNS_SANDBOX=true (TestFlight/debug builds use
// the sandbox APNs host) before relying on it.

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Apple asks that this token be reused for up to ~55 minutes rather than
// minted per request, to avoid being rate-limited.
let cachedApnsJwt: { token: string; mintedAt: number } | null = null;

function apnsJwt(): string | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;
  if (!keyId || !teamId || !privateKey) return null;

  if (cachedApnsJwt && Date.now() - cachedApnsJwt.mintedAt < 55 * 60 * 1000) {
    return cachedApnsJwt.token;
  }

  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = base64url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const signingInput = `${header}.${payload}`;

  const sign = createSign("SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKey.replace(/\\n/g, "\n"), dsaEncoding: "ieee-p1363" });

  const token = `${signingInput}.${base64url(signature)}`;
  cachedApnsJwt = { token, mintedAt: Date.now() };
  return token;
}

/** Resolves with the APNs response status, or null if APNs isn't configured. */
function sendApnsNotification(deviceToken: string, payload: PushPayload): Promise<number | null> {
  const bundleId = process.env.APNS_BUNDLE_ID;
  const jwt = apnsJwt();
  if (!bundleId || !jwt) return Promise.resolve(null);

  const host =
    process.env.APNS_SANDBOX === "true" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";

  return new Promise((resolve) => {
    const client = http2.connect(host);
    client.on("error", () => resolve(null));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "content-type": "application/json",
    });

    let status: number | null = null;
    req.on("response", (headers) => {
      status = Number(headers[":status"]) || null;
    });
    req.on("end", () => {
      client.close();
      resolve(status);
    });
    req.on("error", () => resolve(null));

    req.end(
      JSON.stringify({
        aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
        url: payload.url,
      })
    );
  });
}

/** Sends `payload` to every push subscription this user has registered, web or native. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const toRemove: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      if (sub.platform === "ios") {
        if (!sub.deviceToken) return;
        const status = await sendApnsNotification(sub.deviceToken, payload);
        // 410 = Unregistered, 400 = BadDeviceToken -- the token is dead either way.
        if (status === 410 || status === 400) toRemove.push(sub.id);
        return;
      }

      if (!sub.endpoint || !sub.p256dh || !sub.auth) return;
      ensureWebPushConfigured();
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (error) {
        // A 404/410 means the browser/OS discarded the subscription -- clean
        // it up so future sends don't keep retrying a dead endpoint.
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) toRemove.push(sub.id);
      }
    })
  );

  if (toRemove.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toRemove } } }).catch(() => {});
  }
}
