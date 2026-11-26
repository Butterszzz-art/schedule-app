import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// This guards every (app) route, redirecting unauthenticated visitors
// to /login and logged-in visitors away from /login.
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");
  // /privacy is public (App Store review, and anyone before they sign up)
  // but, unlike login/signup, doesn't redirect a logged-in visitor away.
  const isPublicRoute = isAuthRoute || req.nextUrl.pathname.startsWith("/privacy");

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/today", req.nextUrl));
  }
});

export const config = {
  // sw.js/manifest.json/icons must be excluded too: a redirect response on
  // sw.js in particular is disallowed by the service worker spec, so an
  // unauthenticated visitor's registration silently fails otherwise.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-192.png|icon-512.png|apple-touch-icon.png).*)",
  ],
};
