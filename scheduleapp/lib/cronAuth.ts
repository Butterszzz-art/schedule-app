/** Vercel Cron (and any manual trigger) must present this as a Bearer token. */
export function isAuthorizedCronRequest(request: Request): boolean {
  const header = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  return !!secret && header === `Bearer ${secret}`;
}
