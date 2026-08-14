import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// This guards every (app) route, redirecting unauthenticated visitors
// to /login and logged-in visitors away from /login.
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/today", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
