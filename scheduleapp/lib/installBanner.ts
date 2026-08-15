/**
 * True only for iOS Safari (not Chrome/Firefox-on-iOS, which are Safari
 * under the hood and share its UA substring but can't install PWAs the
 * same way) that isn't already running standalone.
 */
export function shouldShowInstallBanner(
  userAgent: string,
  isStandalone: boolean
): boolean {
  if (isStandalone) return false;

  const ua = userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|opios/.test(ua);

  return isIOS && isSafari;
}
